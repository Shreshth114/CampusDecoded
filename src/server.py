"""Local FastAPI API and dashboard. Run one worker for local JSON/Chroma storage."""
import asyncio
import json
import os
import secrets
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import asdict
from pathlib import Path
import time
from typing import Literal

from fastapi import FastAPI, Request, HTTPException
from src.institutions import registry, create_institution, update_institution, current, resolve, scope, workspace_path, _current
from src import documents, config
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, StrictStr, field_validator

from src.config import HOST, PORT, PROJECT_ROOT, PROVIDERS
from src.pipeline import ask
from src.retrieve import retrieve
from src.reindex import reindex
from src.cache import get_cache_stats, clear_cache
from src.store import get_collection_count, has_chunks
from src.authority import get_registry, approved_sources

_reindex_lock = asyncio.Lock()
_rate_windows = defaultdict(deque)
RATE_LIMIT = 30
WEB_DIR = PROJECT_ROOT / "web"
BENCH_RESULTS_DIR = PROJECT_ROOT / "bench" / "results"


@asynccontextmanager
async def lifespan(app):
    yield


app = FastAPI(title="CampusDecoded", lifespan=lifespan)
from src.whatif import router as whatif_router
app.include_router(whatif_router)


class QuestionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    institution_id: StrictStr
    question: StrictStr
    mode: Literal["raw", "hyde", "fusion"] = "hyde"

    @field_validator("question")
    @classmethod
    def clean_question(cls, value):
        value = value.strip()
        if not value or any(ord(c) < 32 and c not in "\n\t\r" for c in value):
            raise ValueError("A nonempty question without control characters is required")
        return value[:500]


@app.middleware("http")
async def guard_requests(request: Request, call_next):
    admin = request.url.path.startswith('/admin/') or request.url.path in {'/reindex','/cache/clear','/cache/stats'}
    if admin:
        token=os.getenv('ADMIN_API_TOKEN','')
        supplied=request.headers.get('Authorization','')
        if not token or not secrets.compare_digest(supplied, 'Bearer '+token):
            return JSONResponse({'detail':'Administrator authentication required'},status_code=401)
    body_data={}
    if request.method in {'POST','PATCH','DELETE'}:
        data = bytearray()
        async for chunk in request.stream():
            data.extend(chunk)
            if len(data) > ((__import__('src.personal',fromlist=['MAX_BYTES']).MAX_BYTES if request.url.path.startswith('/personal/') else documents.MAX_FILE_BYTES)*5+65536 if request.url.path.endswith('/documents') else 8192):
                return JSONResponse({"error": "Request body exceeds 8 KB"}, status_code=413)
        request._body = bytes(data)
        try: body_data=json.loads(data) if data else {}
        except (ValueError, UnicodeError): pass
        now = time.monotonic()
        key = request.client.host if request.client else "local"
        for host in list(_rate_windows):
            if not _rate_windows[host] or _rate_windows[host][-1] < now - 60:
                del _rate_windows[host]
        if len(_rate_windows) >= 1024 and key not in _rate_windows:
            return JSONResponse({"error": "Server busy"}, status_code=429)
        window = _rate_windows[key]
        while window and window[0] <= now - 60:
            window.popleft()
        if len(window) >= RATE_LIMIT:
            return JSONResponse({"error": "Too many requests; retry in a minute"},
                                status_code=429, headers={"Retry-After": "60"})
        window.append(now)
    if request.url.path.startswith('/personal/'):
        if request.url.path in {'/personal/workspaces','/personal/demo'} and request.method=='POST':return await call_next(request)
        from src import personal
        try:ctx=personal.resolve(request.headers.get('X-Workspace-ID'))
        except ValueError:return JSONResponse({'detail':'Personal workspace unavailable; start or restore your workspace'},status_code=404)
        with scope(ctx):return await call_next(request)
    parts=request.url.path.strip('/').split('/')
    iid=(parts[2] if len(parts)>2 and parts[:2]==['admin','institutions'] else
         parts[1] if len(parts)>2 and parts[0]=='institutions' else
         request.query_params.get('institution_id') or (body_data.get('institution_id') if isinstance(body_data,dict) else None))
    if isinstance(body_data,dict) and body_data.get('institution_id') and iid != body_data['institution_id']:
        return JSONResponse({'detail':'Conflicting institution selection'},status_code=422)
    needs_scope=request.url.path in {'/ask','/compare','/sources','/reindex','/cache/clear','/cache/stats','/bench/status'} or request.url.path.startswith('/bench/results/') or iid is not None
    if needs_scope:
        try: ctx=resolve(iid,public=not admin)
        except ValueError as exc: return JSONResponse({'detail':str(exc)},status_code=422)
        with scope(ctx): return await call_next(request)
    return await call_next(request)


@app.post("/ask")
async def ask_endpoint(body: QuestionRequest):
    try:
        trace = await ask(question=body.question, mode=body.mode)
    except Exception:
        raise HTTPException(503, "Pipeline unavailable; check local service configuration")
    return trace.to_dict()


@app.post("/compare")
async def compare_endpoint(body: QuestionRequest):
    async def run(mode):
        try:
            result = await retrieve(body.question, mode=mode, production=True)
            from src.evidence import merge_blocks
            result.chunks=merge_blocks(result.chunks)
            return asdict(result)
        except Exception:
            return {"mode": mode, "chunks": [], "error": "Retrieval unavailable", "timings_ms": {}}
    from src.hyde import request_generations
    generation_scope = request_generations.set({})
    try:
        raw, hyde, fusion = await asyncio.gather(run("raw"), run("hyde"), run("fusion"))
    finally:
        pending = request_generations.get() or {}
        for task in pending.values():
            if not task.done(): task.cancel()
        if pending:
            await asyncio.gather(*pending.values(), return_exceptions=True)
        request_generations.reset(generation_scope)
    from bench.run_benchmark import load_queries
    verified_gold = []
    try:
        for query in load_queries():
            if query.get("labels_verified") is True and not query.get("is_synthetic") and query["query"].strip().casefold() == body.question.casefold():
                verified_gold = query.get("gold_chunk_ids", [])
                break
    except (OSError, ValueError):
        pass
    # Text previews are available to the dashboard; full text remains in this local API.
    for result in (raw, hyde, fusion):
        for chunk in result["chunks"]:
            from src.evidence import relevant_sentence
            chunk['text_preview']=relevant_sentence(chunk.get('text',''),body.question)
            appearances=sum(chunk['chunk_id'] in {c['chunk_id'] for c in r['chunks']} for r in (raw,hyde,fusion))
            chunk['method_unique']=appearances<3
            chunk['method_presence']=[name for name,r in [('raw',raw),('hyde',hyde),('fusion',fusion)] if chunk['chunk_id'] in {c['chunk_id'] for c in r['chunks']}]
            chunk["verified_gold_match"] = bool(set(chunk.get("source_chunk_ids") or [chunk["chunk_id"]]) & set(verified_gold))
    return {"question": body.question, "raw": raw, "hyde": hyde, "fusion": fusion,
            "labels_verified": bool(verified_gold)}


@app.post("/reindex")
async def reindex_endpoint():
    if _reindex_lock.locked():
        raise HTTPException(409, "Indexing is already running")
    async with _reindex_lock:
        try:
            return await asyncio.to_thread(reindex)
        except Exception:
            raise HTTPException(503, "Indexing failed; check local files and manifest")


@app.post("/cache/clear")
async def clear_cache_endpoint():
    try:
        return {"cleared": await asyncio.to_thread(clear_cache)}
    except Exception:
        raise HTTPException(503, "Answer cache unavailable")


@app.get("/cache/stats")
async def cache_stats_endpoint():
    try:
        return await asyncio.to_thread(get_cache_stats)
    except Exception:
        raise HTTPException(503, "Answer cache unavailable")


@app.get("/sources")
async def sources_endpoint():
    registry = await asyncio.to_thread(get_registry)
    active = await asyncio.to_thread(approved_sources)
    return {"sources": [
        {k: entry.get(k) for k in ("doc_id", "doc_title", "institution", "authority_status",
                                   "effective_date", "source_url", "file_hash", "is_synthetic")}
        | {"eligible": doc_id in active}
        for doc_id, entry in registry.items() if doc_id in active
    ]}


@app.get("/health")
async def health():
    if not _current.get():
        return {'status':'ok','storage_mode':config.STORAGE_MODE,'institutions':len(registry()),'providers':{name:{'configured':bool(cfg.get('api_key') and cfg.get('model'))} for name,cfg in PROVIDERS.items()}}
    try:
        chunks, eligible, cache = await asyncio.gather(
            asyncio.to_thread(get_collection_count), asyncio.to_thread(has_chunks),
            asyncio.to_thread(get_cache_stats),
        )
        return {"status": "ok", "storage_mode": config.STORAGE_MODE, "chunks": chunks, "production_ready": eligible,
                "corpus_status": "approved_sources_available" if eligible else "no_approved_policies",
                "cache": cache, "providers": {
                    name: {"configured": bool(cfg.get("api_key") and cfg.get("model"))}
                    for name, cfg in PROVIDERS.items()
                }}
    except Exception:
        return JSONResponse({"status": "unavailable", "error": "Local storage unavailable"}, status_code=503)


@app.get("/bench/status")
async def benchmark_status():
    from bench.run_benchmark import load_queries
    try:
        queries = await asyncio.to_thread(load_queries)
        verified = sum(q.get("labels_verified") is True for q in queries)
        return {"queries": len(queries), "verified_labels": verified,
                "status": "ready" if queries and verified == len(queries) else "awaiting_verified_labels",
                "results_available": (workspace_path('results') / 'latest.json').is_file()}
    except (ValueError, OSError):
        raise HTTPException(503, "Benchmark queries unavailable")


@app.get("/bench/results/{filename}")
async def serve_bench_result(filename: str):
    if filename not in {"latest.json", "latest.md", "latest.svg"}:
        raise HTTPException(404, "Not found")
    result_dir=workspace_path('results')
    filepath = (result_dir / filename).resolve()
    if filepath.parent != result_dir.resolve() or not filepath.is_file():
        raise HTTPException(404, "No benchmark results yet")
    return FileResponse(filepath)



class InstitutionRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    name: StrictStr
    slug: StrictStr | None = None

class PublicationRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    published: bool
    status: Literal['active','disabled']='active'

class ReviewRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    version_id: StrictStr
    source_url: str | None = None
    issuing_authority: str | None = None
    programme: str | None = None
    cohort: str | None = None
    effective_date: str | None = None
    reviewer: StrictStr
    notes: str | None = None

@app.get('/institutions')
async def list_institutions():
    return {'institutions':[e for e in registry().values() if e['status']=='active' and e['published']]}

@app.get('/admin/institutions')
async def admin_institutions(): return {'institutions':list(registry().values())}

@app.post('/admin/institutions')
async def add_institution(body:InstitutionRequest):
    try: return create_institution(body.name,body.slug)
    except ValueError as exc: raise HTTPException(422,str(exc))

@app.patch('/admin/institutions/{institution_id}')
async def publication(institution_id:str,body:PublicationRequest):
    if body.published and not await asyncio.to_thread(has_chunks):
        raise HTTPException(409,'Approve eligible evidence before publishing')
    return update_institution(institution_id,**body.model_dump())

@app.post('/admin/institutions/{institution_id}/documents')
async def upload_documents(institution_id:str,request:Request):
    form=await request.form()
    files=form.getlist('files')
    if not files or len(files)>5: raise HTTPException(422,'Upload one to five PDFs')
    results=[]
    for file in files:
        try:
            content=await file.read((__import__('src.personal',fromlist=['MAX_BYTES']).MAX_BYTES if current().personal else documents.MAX_FILE_BYTES)+1)
            results.append({'source':await asyncio.to_thread(documents.upload,file.filename,content,form.get('document_id'))})
        except (ValueError,AttributeError) as exc: results.append({'error':str(exc)})
    return {'documents':results,'indexing':'pending; run scoped reindex'}

@app.get('/admin/institutions/{institution_id}/sources')
async def admin_sources(institution_id:str):
    entries=await asyncio.to_thread(get_registry)
    return {'institution':registry()[institution_id],'sources':list(entries.values()),
            'chunks':await asyncio.to_thread(get_collection_count)}

@app.get('/admin/institutions/{institution_id}/sources/{document_id}')
async def source_detail(institution_id:str,document_id:str):
    from src.store import get_collection
    from src.ingest import extract_pages
    entry=get_registry().get(document_id)
    if not entry: raise HTTPException(404,'Source not found')
    records=await asyncio.to_thread(get_collection().get,where={'$and':[current().filter,{'doc_id':document_id},{'version_id':entry['version_id']}]},include=['documents','metadatas'])
    pages=await asyncio.to_thread(extract_pages,Path(entry['source_path']))
    return {'source':entry,'pages':[{'page':n,'text':text,'parser':parser} for n,text,parser in pages],
            'chunks':[{'chunk_id':cid,'text':text,**meta} for cid,text,meta in zip(records['ids'],records['documents'],records['metadatas'])]}

@app.get('/admin/institutions/{institution_id}/sources/{document_id}/original')
async def source_original(institution_id:str,document_id:str):
    entry=get_registry().get(document_id)
    if not entry: raise HTTPException(404,'Source not found')
    path=Path(entry['source_path']).resolve()
    if not path.is_relative_to(current().raw.resolve()): raise HTTPException(403,'Invalid source location')
    return FileResponse(path,media_type='application/pdf',filename=entry['original_filename'])

@app.post('/admin/institutions/{institution_id}/sources/{document_id}/{action}')
async def review_source(institution_id:str,document_id:str,action:str,body:ReviewRequest):
    statuses={'approve':'approved','reject':'rejected','pending':'pending'}
    if action not in statuses: raise HTTPException(404,'Unknown review action')
    try:
        values=body.model_dump();version=values.pop('version_id')
        return await asyncio.to_thread(documents.review,document_id,version,statuses[action],values)
    except (ValueError,OSError) as exc: raise HTTPException(409,str(exc))

@app.delete('/admin/institutions/{institution_id}/sources/{document_id}')
async def remove_source(institution_id:str,document_id:str):
    try: return await asyncio.to_thread(documents.remove,document_id)
    except ValueError as exc: raise HTTPException(404,str(exc))

@app.post('/admin/institutions/{institution_id}/reindex')
async def scoped_reindex(institution_id:str): return await reindex_endpoint()

@app.get('/admin/institutions/{institution_id}/activity')
async def index_activity(institution_id:str):
    path=workspace_path('processed')/'index_activity.json'
    return json.loads(path.read_text()) if path.exists() else {'status':'idle','institution_id':institution_id}

@app.patch('/admin/institutions/{institution_id}/sources/{document_id}/reindex-current')
async def reindex_document(institution_id:str,document_id:str):
    if document_id not in get_registry():raise HTTPException(404,'Source not found')
    if _reindex_lock.locked():raise HTTPException(409,'Indexing is already running')
    async with _reindex_lock:return await asyncio.to_thread(reindex,document_id,**({'force':True} if current().personal else {}))

@app.post('/admin/institutions/{institution_id}/cache/clear')
async def scoped_cache_clear(institution_id:str): return await clear_cache_endpoint()

@app.get('/admin/institutions/{institution_id}/bench/status')
async def admin_bench_status(institution_id:str): return await benchmark_status()

@app.post('/admin/institutions/{institution_id}/bench/run')
async def admin_bench_run(institution_id:str):
    from bench.run_benchmark import run_benchmark
    return await run_benchmark()

@app.get('/institutions/{institution_id}/citations/{chunk_id}')
async def citation_detail(institution_id:str,chunk_id:str):
    from src.store import get_collection,production_filter
    where=production_filter()
    if not where: raise HTTPException(404,'Citation unavailable')
    record=await asyncio.to_thread(get_collection().get,ids=[chunk_id],where=where,include=['documents','metadatas'])
    if not record['ids']: raise HTTPException(404,'Citation unavailable')
    return {'chunk_id':chunk_id,'text':record['documents'][0],**{k:v for k,v in record['metadatas'][0].items() if k!='source_path'}}


from src.personal_api import router as personal_router
app.include_router(personal_router)

@app.get("/")
async def serve_ui():
    return HTMLResponse((WEB_DIR / "index.html").read_text())


@app.get('/demo.js')
async def demo_script():return FileResponse(WEB_DIR/'demo.js',media_type='text/javascript')

@app.get('/ui.js')
async def ui_script():return FileResponse(WEB_DIR/'ui.js',media_type='text/javascript')

@app.get('/personal.js')
async def personal_script():return FileResponse(WEB_DIR/'personal.js',media_type='text/javascript')

@app.get("/app.js")
async def serve_script():
    return FileResponse(WEB_DIR / "app.js", media_type="text/javascript")


def main():
    import uvicorn
    uvicorn.run("src.server:app", host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    main()
