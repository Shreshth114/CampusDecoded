"""Immutable request context; JSON workspaces, never request-mutated global paths."""
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from pathlib import Path
import json
import re
import time
import uuid
from threading import RLock
from src.config import PROJECT_ROOT, DATA_ROOT
from src.persistence import write_json

_LOCK = RLock()
_current = ContextVar('institution_context', default=None)

@dataclass(frozen=True)
class InstitutionContext:
    institution_id: str
    root: Path
    workspace_id: str = ''
    @property
    def personal(self): return bool(self.workspace_id)
    @property
    def scope_id(self): return self.workspace_id or self.institution_id
    @property
    def filter(self): return {'workspace_id':self.workspace_id} if self.personal else {'institution_id':self.institution_id}
    def owns(self, value):
        return value.workspace_id==self.workspace_id and not value.institution_id if self.personal else value.institution_id==self.institution_id and not getattr(value,'workspace_id','')
    @property
    def raw(self): return self.root / 'raw'
    @property
    def processed(self): return self.root / 'processed'
    @property
    def bench(self): return self.root / 'bench'
    def path(self, name):
        return {'raw': self.raw, 'processed': self.processed,
                'registry': self.processed/'source_registry.json',
                'manifest': self.processed/'manifest.json',
                'cache': self.processed/'answer_cache.json',
                'hyde': self.processed/'hyde_cache.json',
                'queries': self.bench/'test_queries.jsonl',
                'results': self.bench/'results',
                'decoys': self.root/'evaluation'}[name]

def registry():
    path = DATA_ROOT/'institutions.json'
    if not path.exists(): return {}
    value = json.loads(path.read_text())
    if not isinstance(value, dict): raise ValueError('Invalid institution registry')
    return value

def create_institution(name, slug=None):
    name=name.strip()
    if slug is None or not slug.strip():
        import unicodedata
        base=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().lower()).strip('-')[:65] or 'institution'
        slug=base
        if any(e['slug']==slug for e in registry().values()):slug=base+'-'+uuid.uuid4().hex[:8]
    slug=slug.strip().lower()
    if not name or len(name)>160 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or len(slug)>80:
        raise ValueError('Provide a name and a unique lowercase URL slug')
    with _LOCK:
        entries=registry()
        if any(e['name'].casefold()==name.casefold() for e in entries.values()): raise ValueError('An institution with this name already exists; select its workspace')
        if any(e['slug']==slug for e in entries.values()): raise ValueError('Institution slug already exists')
        iid=str(uuid.uuid4())
        entries[iid]={'institution_id':iid,'name':name,'slug':slug,'status':'active','published':False,'created_at':time.time()}
        ctx=InstitutionContext(iid, DATA_ROOT/'workspaces'/iid)
        for path in (ctx.raw,ctx.processed,ctx.path('results'),ctx.path('decoys')): path.mkdir(parents=True,exist_ok=True)
        for key,value in [('registry',{}),('manifest',{}),('cache',[]),('hyde',{})]: write_json(ctx.path(key),value)
        ctx.path('queries').write_text('')
        write_json(DATA_ROOT/'institutions.json',entries)
        return entries[iid]

def resolve(institution_id, public=False):
    if not isinstance(institution_id,str) or institution_id not in registry(): raise ValueError('A valid institution_id is required')
    entry=registry()[institution_id]
    if public and (entry['status']!='active' or not entry['published']): raise ValueError('Institution is not published')
    return InstitutionContext(institution_id,DATA_ROOT/'workspaces'/institution_id)

def current():
    ctx=_current.get()
    if ctx is None: raise ValueError('Institution context is required')
    return ctx

@contextmanager
def scope(ctx):
    token=_current.set(ctx)
    try: yield ctx
    finally: _current.reset(token)

def workspace_path(name): return current().path(name)

def update_institution(iid, **changes):
    with _LOCK:
        entries=registry()
        if iid not in entries: raise ValueError('Unknown institution')
        if set(changes)-{'published','status'}: raise ValueError('Immutable institution fields')
        if 'status' in changes and changes['status'] not in {'active','disabled'}: raise ValueError('Invalid status')
        entries[iid].update(changes); write_json(DATA_ROOT/'institutions.json',entries)
        return entries[iid]
