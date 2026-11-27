'use strict';
const byId = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numeric = value => typeof value === 'number' && Number.isFinite(value);
const format = value => value == null ? '—' : numeric(value) ? value.toFixed(3) : escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value);
let askBusy = false, compareBusy = false;
let latestTrace = null;
let institutionId = '', generation = 0, adminToken = '', selectedSource = null;
let studentInstitutionId='', adminInstitutionId='', publicInstitutions=[], adminInstitutions=[];
let currentView='home', inspectionGeneration=0, studentReady=false, uploadFiles=[], uploadBusy=false, originalUrl=null;
const NO_POLICIES='No verified institutional policies are currently available for this institution. Please contact your institution administrator.';
function clearOriginal(){if(originalUrl){URL.revokeObjectURL(originalUrl);originalUrl=null;}}
function switchInstitution(value) {
  institutionId=value;generation++;latestTrace=null;selectedSource=null;clearOriginal();
  for(const id of ['messages','internals','compare-results','bench-content','source-list','document-review','admin-summary','cache-stats']) byId(id).textContent='';
  byId('question').value='';byId('compare-q').value='';byId('ask-status').textContent='';
  byId('internals').innerHTML='<h2>Evidence & explainability</h2><p class="muted">Ask a question to see source passages, confidence, citations and stage timings.</p>';
}
function showView(view){
  currentView=view;
  if(typeof SafeUI!=='undefined')byId('trust-footer').textContent=SafeUI.footer(view!=='chat'&&!(view==='compare'&&!usePersonalAdvanced())&&!(view==='bench'&&!usePersonalAdvanced()));
  const personalAdvanced=['compare','bench'].includes(view)&&usePersonalAdvanced();
  const next=view==='sources'?adminInstitutionId:studentInstitutionId;
  if(next!==institutionId)switchInstitution(next);
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
  document.querySelectorAll('.view').forEach(el=>{el.hidden=el.id!=='view-'+view;});
  byId('student-context').hidden=personalAdvanced||!['chat','compare','bench'].includes(view)||!studentInstitutionId;
  byId('corpus-notice').hidden=!personalAdvanced&&(!['chat','compare','bench'].includes(view)||!studentInstitutionId);
  if(personalAdvanced)byId('compare-btn').disabled=compareBusy;
  if(personalAdvanced)byId('corpus-notice').textContent='Based on documents you uploaded. Not verified by your institution. Advanced tools use only your personal workspace.';
  if(view==='home')loadInstitutions().catch(error=>{byId('institution-status').textContent=error.message;});
  if(view==='sources'&&adminToken&&adminInstitutionId)loadSources();
  if(['chat','compare','bench'].includes(view)&&!personalAdvanced){
    if(!studentInstitutionId&&!usePersonalAdvanced()){byId('student-empty').innerHTML='<h2>Choose your institution to begin</h2><p>Select a published college or university on Overview, then enter its workspace.</p><button data-go-home>Choose institution</button>';byId('student-chat').hidden=true;byId('student-empty').hidden=false;byId('compare-results').textContent='Select an institution on Overview first.';byId('bench-content').textContent='Select an institution on Overview first.';}
    else if(studentInstitutionId)checkStudentReadiness();
  }
  if(view==='bench'&&(studentInstitutionId||usePersonalAdvanced()))loadBenchmark();
}
async function enterStudent(){
  const selected=byId('institution').value;
  if(!selected){byId('institution-status').textContent='Select a published college or university first.';return;}
  studentInstitutionId=selected;byId('advanced-scope').value='institution';switchInstitution(selected);showView('chat');
}
async function checkStudentReadiness(){
  const ticket=generation;
  const selected=publicInstitutions.find(i=>i.institution_id===studentInstitutionId);
  byId('selected-institution-name').textContent=selected?.name||'Selected institution';
  byId('student-readiness').textContent='Checking approved evidence…';
  studentReady=false;byId('send-btn').disabled=true;byId('compare-btn').disabled=true;
  try{
    const data=await api(studentPath('/health'));if(ticket!==generation)return;
    studentReady=data.production_ready===true;
    byId('student-readiness').textContent=studentReady?'Approved evidence available':'No approved evidence';
    byId('corpus-notice').textContent=studentReady?'Searching approved documents from '+(selected?.name||'your institution')+'. Open citations to inspect the evidence.':NO_POLICIES;
    byId('student-chat').hidden=!studentReady;byId('student-empty').hidden=studentReady;
    if(!studentReady)byId('student-empty').innerHTML='<h2>Policies awaiting verification</h2><p>'+NO_POLICIES+'</p><button data-go-home>Choose another institution</button>';
    byId('send-btn').disabled=!studentReady||askBusy;byId('compare-btn').disabled=!studentReady||compareBusy;
    if(studentReady&&!latestTrace&&!byId('messages').children?.length)byId('messages').innerHTML='<div class="empty-state">Your answers and citations will appear here. Try an example question above.</div>';
  }catch(error){if(ticket!==generation)return;byId('student-readiness').textContent='Evidence unavailable';byId('student-chat').hidden=true;byId('student-empty').hidden=false;byId('student-empty').textContent=error.message;}
}
async function selectAdmin(value){
  adminInstitutionId=value;switchInstitution(value);byId('workspace-management').hidden=!value;
  uploadFiles=[];byId('uploads').value='';byId('upload-selection').textContent='No files selected.';byId('upload-submit').disabled=true;
  byId('admin-workspace-hint').textContent=value?'Manage this institution’s documents below.':'Choose a workspace to manage its documents.';
  if(value)await loadSources();
}

function adminPath(suffix='') { if(!institutionId) throw new Error('Choose an institution'); return '/admin/institutions/'+encodeURIComponent(institutionId)+suffix; }
function advancedRequestCurrent(ticket,personalTicket){return ticket===generation&&(typeof window==='undefined'||(window.personalEpoch||0)===personalTicket);}
function usePersonalAdvanced(){return typeof window!=='undefined'&&window.personalWorkspaceId&&byId('advanced-scope')?.value!=='institution';}
function studentPath(path) { if(usePersonalAdvanced())return '/personal'+path;return path+'?institution_id='+encodeURIComponent(institutionId); }

async function api(path, body, method) {
  const requestStarted=Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), /reindex/.test(path)?1800000:120000);
  try {
    const multipart=typeof FormData!=='undefined' && body instanceof FormData;
    const headers={...(path.startsWith('/personal/')&&typeof window!=='undefined'?{'X-Workspace-ID':window.personalWorkspaceId}:{}),...(body===undefined || multipart ? {} : {'Content-Type':'application/json'}),...(path.startsWith('/admin/') ? {'Authorization':'Bearer '+adminToken} : {})};
    const response=await fetch(path,{signal:controller.signal,headers,method:method || (body===undefined?'GET':'POST'),...(body===undefined?{}:{body:multipart?body:JSON.stringify(body)})});
    const data = await response.json();
    if(['/ask','/compare'].includes(path)||['/personal/ask','/personal/compare'].includes(path)){if(typeof SessionMetrics!=='undefined')SessionMetrics.record(data,Date.now()-requestStarted);}
    if (!response.ok) throw new Error(typeof data.detail==='string'?data.detail:Array.isArray(data.detail)?data.detail.map(item=>(item.loc||[]).slice(1).join('.')+': '+item.msg).join('; '):data.error||`Request failed (${response.status})`);
    return data;
  } finally { clearTimeout(timer); }
}
function table(rows, headers = ['Field', 'Value']) {
  return '<div class="table-wrap"><table><thead><tr>'+headers.map(h => '<th scope="col">'+escapeHtml(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row => '<tr>'+row.map(v => '<td>'+format(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function chunkCard(c, index, traceId='') {
  const score = c.score ?? c.similarity;
  const width = numeric(score) ? Math.max(0, Math.min(1, score))*100 : 0;
  return `<article class="chunk${c.verified_gold_match||c.method_unique ? ' selected' : ''}" ${traceId ? `id="chunk-${traceId}-${index}" tabindex="-1"` : ''}>
    <strong>[C${index+1}] ${escapeHtml(c.doc_title)}</strong>${c.method_unique?'<span class="badge">Not shared by all methods</span>':''}<div class="muted">${escapeHtml(c.section)} · page ${escapeHtml(c.page || 'not available')}</div>
    <small>Parser: ${escapeHtml(c.extraction_method || 'unknown')} · Cosine similarity: ${format(score)}${c.rrf_score == null ? '' : ' · RRF rank score: '+format(c.rrf_score)}</small>
    <div class="bar"><span style="width:${width}%"></span></div><p>${escapeHtml(c.text_preview)}</p>${c.chunk_id ? `<details data-personal="${!!c.workspace_id}" data-excerpt="${escapeHtml(c.chunk_id)}"><summary>Full policy excerpt</summary><pre>Open to load the approved excerpt.</pre></details>` : ''}
    <small>${c.is_decoy ? 'Decoy — evaluation only' : c.is_synthetic ? 'Synthetic fixture — evaluation only' : c.workspace_id ? 'Personal upload — unverified' : c.approved ? 'Explicitly approved source' : 'Unapproved source'}${c.verified_gold_match ? ' · Verified benchmark target' : ''}</small></article>`;
}
function wireExcerpts(container){
  const ticket=generation;const iid=institutionId;
  container.querySelectorAll?.('[data-excerpt]').forEach(details=>details.addEventListener('toggle',async()=>{
    if(!details.open || details.dataset.loaded)return;
    const pre=details.querySelector('pre');pre.textContent='Loading approved source…';
    try{const data=await api(details.dataset.personal==='true'?'/personal/citations/'+encodeURIComponent(details.dataset.excerpt):'/institutions/'+encodeURIComponent(iid)+'/citations/'+encodeURIComponent(details.dataset.excerpt));if(ticket!==generation)return;pre.textContent=data.text;details.dataset.loaded='true';}
    catch(error){if(ticket===generation)pre.textContent=error.message;}
  }));
}
function addMessage(text, kind, trace = null) {
  const div = document.createElement('div');
  div.className = 'message '+kind;
  let safe = typeof SafeUI!=='undefined'?SafeUI.render(text,{maxCitation:trace?.retrieved?.length||0}):escapeHtml(text);
  if (trace) safe = safe.replace(/\[C(\d+)\]/g, (whole, n) => {
    const index = Number(n)-1;
    return trace.retrieved?.[index] ? `<button type="button" class="citation" data-citation="${index}" title="View source excerpt">[C${n}]</button>` : whole;
  });
  div.innerHTML = safe;
  if (trace) div.addEventListener('click', event => {
    const button = event.target.closest('[data-citation]');
    if (!button) return;
    renderInternals(trace);
    const card = byId('chunk-current-'+button.dataset.citation);
    card?.scrollIntoView({behavior:'smooth', block:'center'});
    card?.focus();
  });
  byId('messages').appendChild(div);
  div.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function renderInternals(trace) {
  latestTrace = trace;
  let html = '<h2>Pipeline trace</h2><span class="badge">'+escapeHtml(trace.mode)+'</span>';
  html += `<span class="badge ${trace.decision === 'answered' ? 'ok' : ''}">${escapeHtml(trace.decision)}</span>`;
  if (trace.decision === 'answered') html += '<span class="badge ok">Citation references checked</span>';
  if (trace.cache_hit) html += '<span class="badge">Answer cache hit · '+format(trace.cache_similarity)+'</span>';
  if (trace.abstain_reason) html += '<p>'+escapeHtml(trace.abstain_reason)+'</p>';
  if (trace.error) html += '<p class="error">'+escapeHtml(trace.error)+'</p>';
  for (const warning of trace.warnings || []) html += '<p class="notice">'+escapeHtml(warning)+'</p>';
  if (trace.hyde_failed) html += '<p class="notice">HyDE failed; raw retrieval was used.</p>';
  if (trace.hyde_text) html += '<h3>Generated search key — never answer evidence</h3><pre>'+escapeHtml(trace.hyde_text)+'</pre>';
  html += '<h3>Source excerpts</h3>'+(trace.retrieved?.length ? trace.retrieved.map((c,i)=>chunkCard(c,i,'current')).join('') : '<p class="muted">No source excerpts retrieved.</p>');
  html += '<h3>Stage timings (ms)</h3>'+table(Object.entries(trace.timings_ms || {}));
  if (Object.keys(trace.llm_usage || {}).length) html += '<h3>Provider usage</h3>'+table(Object.entries(trace.llm_usage));
  byId('internals').innerHTML = html;
  wireExcerpts(byId('internals'));
}
async function sendQuestion(event) {
  event?.preventDefault();
  const q = byId('question').value.trim();
  if (!q || askBusy || !institutionId) return;
  const ticket=generation;
  askBusy = true; byId('send-btn').disabled = true;
  byId('ask-status').textContent='Searching evidence and checking citations…';
  addMessage(q,'user'); byId('question').value = '';
  try {
    const trace = await api('/ask', {institution_id:institutionId,question:q, mode:byId('mode').value});
    if(ticket!==generation) return;
    addMessage(trace.answer || trace.error || 'No answer returned.', trace.error ? 'error' : trace.decision, trace);
    renderInternals(trace);
  } catch (error) { if(ticket!==generation) return; addMessage(error.name === 'AbortError' ? 'Request timed out. Retry when the service is ready.' : error.message, 'error'); }
  finally { askBusy = false; byId('send-btn').disabled = false;if(ticket===generation)byId('ask-status').textContent=''; }
}
function renderCompare(data) {
  function column(title, result) {
    let html = '<div class="panel"><h3>'+escapeHtml(title)+'</h3>';
    if (result.error) html += '<p class="error">'+escapeHtml(result.error)+'</p>';
    if (result.hyde_failed) html += '<p class="notice">HyDE failed; showing raw fallback.</p>';
    if (result.hyde_text) html += '<small>Generated search key — not policy evidence</small><pre>'+escapeHtml(result.hyde_text)+'</pre>';
    html += '<small>Total: '+format(result.timings_ms?.total)+' ms</small>';
    html += result.chunks?.length ? result.chunks.slice(0,3).map((c,i)=>chunkCard(c,i)).join('') : '<p>No approved matching source excerpts.</p>';
    return html+'</div>';
  }
  byId('compare-results').innerHTML = column('Raw query search', data.raw)+column('HyDE search', data.hyde)+(data.fusion?column('Fusion ranking',data.fusion):'');
  wireExcerpts(byId('compare-results'));
}
async function runCompare(event) {
  event?.preventDefault();
  const q = byId('compare-q').value.trim();
  if(!institutionId&&!usePersonalAdvanced()){byId('compare-results').textContent='Select a published institution on Overview first.';return;}
  if (!q || compareBusy) return;
  const ticket=generation,personalTicket=typeof window==='undefined'?0:(window.personalEpoch||0);
  compareBusy = true; byId('compare-btn').disabled = true;
  byId('compare-results').innerHTML = '<div class="panel" role="status">Comparing retrieval…</div>';
  try { const data=await api(usePersonalAdvanced()?'/personal/compare':'/compare',usePersonalAdvanced()?{question:q}:{institution_id:institutionId,question:q}); if(advancedRequestCurrent(ticket,personalTicket)) renderCompare(data); }
  catch(error) { if(!advancedRequestCurrent(ticket,personalTicket)) return; byId('compare-results').innerHTML = '<p class="error">'+escapeHtml(error.message)+'</p>'; }
  finally { compareBusy = false; byId('compare-btn').disabled = false; }
}
function renderBenchmark(data) {
  const meta = data.metadata || {};
  let html = `<h3>${escapeHtml(meta.status || 'Unknown run status')}</h3>`;
  if (meta.labels_verified !== true || meta.evaluation_scope !== 'production') html += '<p class="notice">No verified real-world accuracy claim. Approved institutional documents and manually verified labels are required.</p>';
  const metrics = data.retrieval_metrics || {};
  const keys = ['recall_at_1','recall_at_3','recall_at_5','mrr','mean_latency_ms','mean_hyde_latency_ms','mean_embed_latency_ms','mean_retrieve_latency_ms','n_queries','errors','hyde_failures'];
  if (Object.keys(metrics).length) {
    html += table(keys.map(key => [key, ...Object.values(metrics).map(m=>m[key])]), ['Metric', ...Object.keys(metrics)]);
    for (const [mode,m] of Object.entries(metrics)) {
      for (const key of ['recall_at_5','mrr']) if (numeric(m[key])) html += `<div class="metric">${escapeHtml(mode)} · ${key}: ${format(m[key])}<div class="bar"><span style="width:${Math.max(0,Math.min(1,m[key]))*100}%"></span></div></div>`;
      html += '<details><summary>'+escapeHtml(mode)+' threshold sweep (retrieval proxy)</summary>'+table((m.threshold_sweep || []).map(r=>[r.threshold,r.retrieval_acceptance_rate,r.accepted_without_gold_rate]), ['Threshold','Retrieval acceptance','Accepted without gold'])+'</details>';
      html += '<details><summary>'+escapeHtml(mode)+' query observations and failures</summary>'+table((m.observations || []).map(r=>[r.id,r.best_similarity,r.gold_hit,r.hyde_failed,r.error]), ['Query','Best cosine','Gold retrieved','HyDE failed','Error'])+'</details>';
    }
  } else html += '<p>No measurements yet. Real policy PDFs and verified labels are pending.</p>';
  html += '<h3>Safety — citation validity is syntactic</h3>';
  for (const [mode,values] of Object.entries(data.safety_metrics || {})) html += '<h3>'+escapeHtml(mode)+'</h3>'+table(Object.entries(values));
  if (Object.keys(data.decoy_isolation || {}).length) html += '<details><summary>Decoy isolation observations (retrieval only)</summary>'+table(Object.entries(data.decoy_isolation))+'</details>';
  html += '<h3>Run metadata</h3>'+table(Object.entries(meta));
  byId('bench-content').innerHTML = html;
}
async function loadBenchmark() {
  if(!institutionId&&!usePersonalAdvanced()){byId('bench-content').textContent='Select a published institution on Overview to view results.';return;} const ticket=generation,personalTicket=typeof window==='undefined'?0:(window.personalEpoch||0);
  byId('bench-content').textContent = 'Loading…';
  try { const data=await api(studentPath('/bench/results/latest.json')); if(advancedRequestCurrent(ticket,personalTicket)) renderBenchmark(data); }
  catch(error) {
    if(!advancedRequestCurrent(ticket,personalTicket))return;
    try { const status = await api(studentPath('/bench/status')); if(!advancedRequestCurrent(ticket,personalTicket))return; byId('bench-content').textContent = `No measured results. ${status.verified_labels}/${status.queries} labels verified. Actual policy PDFs and reviewed labels are pending.`; }
    catch { if(!advancedRequestCurrent(ticket,personalTicket))return; byId('bench-content').textContent = 'Benchmark service unavailable. Check the local server.'; }
  }
}
async function refreshHealth() {
  try {
    const data = await api('/health');
    const notice=byId('deployment-notice');
    if(notice){notice.hidden=data.storage_mode!=='ephemeral';notice.textContent='Temporary demo: uploads, workspace links and indexes may be lost when the service sleeps, restarts or redeploys. Keep your original PDFs.';}
    if(data.chunks==null){byId('health').textContent='CampusDecoded ready · personal upload & analysis';return;}
    byId('health').textContent = `${data.chunks} indexed chunks · ${data.production_ready ? 'approved corpus ready' : 'no approved policies'}`;
    byId('corpus-notice').textContent = data.production_ready ? 'Searching explicitly approved source versions. Citation checks validate references, not semantic faithfulness.' : 'No approved policy corpus is available. Answers will abstain until actual source documents are added and reviewed.';
  } catch { byId('health').textContent = 'Local service unavailable'; }
}
async function loadSources() {
  if(!adminToken||!institutionId)return;
  const ticket=generation;byId('source-list').textContent='Loading documents…';
  try {
    const data=await api(adminPath('/sources'));if(ticket!==generation)return;
    byId('admin-workspace-name').textContent=data.institution?.name||'Selected workspace';
    byId('admin-publication-status').textContent=(data.institution?.published?'Published · visible to students':'Unpublished · visible only to administrators')+' · '+(data.institution?.status||'active');
    const counts={uploaded:data.sources.length,pending:0,approved:0,rejected:0,failed:0,chunks:data.chunks};
    for(const source of data.sources){counts[source.authority_status]++;if(source.extraction_status==='failed')counts.failed++;}
    byId('admin-summary').innerHTML=Object.entries(counts).map(([key,value])=>'<div class="stat"><b>'+escapeHtml(value)+'</b><span>'+escapeHtml(key==='failed'?'Extraction failures':key)+'</span></div>').join('');
    byId('publish-btn').disabled=counts.approved===0;byId('unpublish-btn').disabled=!data.institution?.published;
    byId('source-list').innerHTML=data.sources.length?data.sources.map(source=>`<article class="chunk"><strong>${escapeHtml(source.doc_title)}</strong><div><span class="badge ${source.authority_status==='approved'?'ok':''}">${escapeHtml(source.authority_status)}</span><span class="badge">${escapeHtml(source.extraction_status)}</span><span class="badge">${escapeHtml(source.chunk_count)} chunks</span></div><p class="error">${escapeHtml(source.extraction_error||'')}</p><small>${escapeHtml(source.original_filename)}</small><p><button data-inspect="${escapeHtml(source.doc_id)}">Inspect original, text & review →</button></p></article>`).join(''):'<div class="empty-state"><h3>No source documents yet</h3><p>Drop PDFs in the upload area above. Extraction and indexing run before your review; approval is always explicit.</p></div>';
    byId('source-list').querySelectorAll?.('[data-inspect]').forEach(button=>button.addEventListener('click',()=>inspectSource(button.dataset.inspect)));
  }catch(error){if(ticket===generation)byId('source-list').textContent=error.message;}
}

async function inspectSource(did){
  const ticket=generation,inspection=++inspectionGeneration;clearOriginal();selectedSource=null;
  try{
    const data=await api(adminPath('/sources/'+encodeURIComponent(did)));if(ticket!==generation||inspection!==inspectionGeneration)return;
    selectedSource=data.source;
    const fields=['source_url','issuing_authority','programme','cohort','effective_date','reviewer','notes'];
    byId('document-review').innerHTML='<h3>'+escapeHtml(data.source.doc_title)+'</h3><p>Document ID: '+escapeHtml(did)+'</p><p>Review: '+escapeHtml(data.source.authority_status)+' · Extraction: '+escapeHtml(data.source.extraction_status)+'</p><p>Current SHA-256 / version: '+escapeHtml(data.source.version_id)+'</p><p>Unknown dates remain blank. Approval records your verification; it does not establish authenticity automatically.</p><div class="review-fields">'+fields.map(key=>`<label>${escapeHtml(key)}<input id="review-${key}" value="${escapeHtml(data.source[key]||'')}"></label>`).join('')+'</div><div class="form"><button id="download-original">Preview original PDF</button><button data-review="approve">Approve this version</button><button data-review="pending">Keep pending</button><button data-review="reject">Reject this version</button><button id="reindex-source">Reindex this document</button><button id="remove-source">Remove from index (retain original)</button></div><div id="original-container" hidden><iframe id="original-preview" title="Original source PDF"></iframe><a id="original-download" download>Download original PDF</a></div><details><summary>Full extracted pages</summary>'+(data.pages.some(p=>p.text.trim())?data.pages.map(p=>'<h3>Page '+escapeHtml(p.page)+'</h3><pre>'+escapeHtml(p.text)+'</pre>').join(''):'<p>No extractable text. Inspect the original PDF; this version cannot enter retrieval until extraction succeeds.</p>')+'</details><details><summary>Indexed chunks ('+data.chunks.length+')</summary>'+data.chunks.map((c,i)=>chunkCard({...c,text_preview:c.text},i)).join('')+'</details><details><summary>Review and version history</summary><pre>'+escapeHtml(JSON.stringify(data.source.history,null,2))+'</pre></details>';
    byId('document-review').querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',async()=>{
      const body={version_id:data.source.version_id};for(const key of fields)body[key]=byId('review-'+key).value.trim()||null;
      if(!body.reviewer||(button.dataset.review==='approve'&&(!body.issuing_authority||!body.source_url))){byId('operation-status').textContent='Enter a reviewer identity. Approval also requires the verified official URL and issuing authority.';return;}
      await adminOperation(()=>api(adminPath('/sources/'+encodeURIComponent(did)+'/'+button.dataset.review),body));
    }));
    byId('reindex-source').onclick=()=>adminOperation(()=>api(adminPath('/sources/'+encodeURIComponent(did)+'/reindex-current'),{},'PATCH'));
    byId('remove-source').onclick=()=>adminOperation(()=>api(adminPath('/sources/'+encodeURIComponent(did)),undefined,'DELETE'));
    byId('download-original').onclick=async()=>{
      try{
        const response=await fetch(adminPath('/sources/'+encodeURIComponent(did)+'/original'),{headers:{Authorization:'Bearer '+adminToken}});
        if(!response.ok)throw new Error('Original unavailable');const blob=await response.blob();
        if(ticket!==generation||selectedSource?.doc_id!==did)return;
        clearOriginal();originalUrl=URL.createObjectURL(blob);
        byId('original-preview').src=originalUrl;byId('original-download').href=originalUrl;byId('original-download').download=data.source.original_filename;byId('original-container').hidden=false;
      }catch(error){if(ticket===generation)byId('operation-status').textContent=error.message;}
    };
  }catch(error){if(ticket===generation)byId('operation-status').textContent=error.message;}
}
async function loadInstitutions(admin=false){
  const ticket=generation;
  const data=await api(admin?'/admin/institutions':'/institutions');
  if(ticket!==generation)return;
  const entries=data.institutions||[];
  if(admin){
    adminInstitutions=entries;
    byId('admin-institution').innerHTML='<option value="">Choose an existing workspace</option>'+entries.map(i=>`<option value="${escapeHtml(i.institution_id)}">${escapeHtml(i.name)} · ${i.published?'Published':'Unpublished'}</option>`).join('');
    byId('admin-institution').value=adminInstitutionId;
    byId('admin-status').textContent=entries.length+' workspace'+(entries.length===1?'':'s')+' available. Select one below, or create an institution.';
  }else{
    publicInstitutions=entries;
    const previous=byId('institution').value;
    byId('institution').innerHTML='<option value="">'+(entries.length?'Choose your institution':'No published institutions yet')+'</option>'+entries.map(i=>`<option value="${escapeHtml(i.institution_id)}">${escapeHtml(i.name)}</option>`).join('');
    if(entries.some(i=>i.institution_id===previous))byId('institution').value=previous;
    byId('institution-status').textContent=entries.length?'Step 1: select your college or university. Step 2: enter its workspace.':'No institutions are published yet. An administrator must review and approve documents, then publish the institution. Open Administration to continue setup.';
    byId('student-entry').disabled=!byId('institution').value;
  }
}
async function unlockAdmin(event){
 event.preventDefault();const ticket=generation;adminToken=byId('admin-token').value;byId('admin-token').value='';
 byId('admin-status').textContent='Authenticating and loading all workspaces…';
 try{await loadInstitutions(true);if(ticket!==generation||!adminToken)return;byId('admin-controls').hidden=false;byId('admin-auth-panel').hidden=true;byId('admin-lock').hidden=false;}
 catch(error){if(ticket!==generation)return;adminToken='';byId('admin-controls').hidden=true;byId('admin-status').textContent=error.message;}
}
async function createWorkspace(event){
 event.preventDefault();const ticket=generation;
 byId('admin-status').textContent='Creating institution workspace…';
 try{
   const data=await api('/admin/institutions',{name:byId('institution-name').value});if(ticket!==generation)return;
   await loadInstitutions(true);byId('admin-institution').value=data.institution_id;await selectAdmin(data.institution_id);
   byId('admin-status').textContent='Workspace created. Upload PDFs below to begin.';
 }catch(error){if(ticket===generation)byId('admin-status').textContent=error.message;}
}
async function adminOperation(work){
 const ticket=generation;const timer=startActivityPoll(ticket);byId('operation-status').textContent='Working…';
 try{
   const data=await work();if(ticket!==generation)return;
   byId('operation-status').textContent=data.status?('Operation complete: '+data.status):'Operation complete. Document and workspace status refreshed.';
   await loadSources();if(selectedSource)await inspectSource(selectedSource.doc_id);
   await loadInstitutions(true);
 }catch(error){if(ticket===generation)byId('operation-status').textContent=error.message;}
 finally{clearInterval(timer);}
}
function chooseFiles(files){
 if(uploadBusy)return;
 uploadFiles=Array.from(files);
 const error=uploadFiles.length>5?'Choose up to five PDFs.':uploadFiles.some(f=>!f.name.toLowerCase().endsWith('.pdf')||f.size>30*1024*1024)?'Every file must be a PDF up to 30 MB.':'';
 byId('upload-selection').textContent=error||uploadFiles.map(f=>f.name+' ('+(f.size/1024/1024).toFixed(2)+' MB)').join(' · ')||'No files selected.';
 byId('upload-submit').disabled=!!error||!uploadFiles.length;
 if(error)uploadFiles=[];
}
function uploadRequest(path,body,onProgress){
 return new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('POST',path);xhr.setRequestHeader('Authorization','Bearer '+adminToken);xhr.timeout=600000;
   xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(100*event.loaded/event.total));};
   xhr.onload=()=>{try{const data=JSON.parse(xhr.responseText);if(xhr.status<200||xhr.status>=300)throw new Error(data.detail||data.error||'Upload failed');resolve(data);}catch(error){reject(error);}};
   xhr.onerror=()=>reject(new Error('Upload failed. Check the local server connection.'));xhr.ontimeout=()=>reject(new Error('Upload timed out. Refresh the document list before retrying.'));xhr.send(body);
 });
}
async function uploadDocuments(event){
 event.preventDefault();if(uploadBusy||!uploadFiles.length||!institutionId)return;
 const replacement=byId('replacement-id').value.trim();
 if(replacement&&uploadFiles.length!==1){byId('upload-status').textContent='Select exactly one PDF when replacing a document.';return;}
 const ticket=generation;const base=adminPath();uploadBusy=true;byId('upload-submit').disabled=true;byId('upload-progress').hidden=false;byId('upload-progress').value=0;
 byId('upload-status').textContent='Uploading PDF originals…';const timer=startActivityPoll(ticket);
 try{
   const body=new FormData();for(const file of uploadFiles)body.append('files',file);if(replacement)body.append('document_id',replacement);
   const uploaded=await uploadRequest(base+'/documents',body,percent=>{if(ticket===generation){byId('upload-progress').value=percent;byId('upload-status').textContent='Uploading originals: '+percent+'%';}});
   if(ticket!==generation)return;byId('upload-progress').value=100;
   const errors=uploaded.documents.filter(row=>row.error).map(row=>row.error);
   for(const row of uploaded.documents.filter(row=>row.source)){
     byId('upload-status').textContent='Extracting, chunking and embedding '+row.source.original_filename+'…';
     const report=await api(base+'/sources/'+encodeURIComponent(row.source.doc_id)+'/reindex-current',{},'PATCH');
     if(ticket!==generation)return;
     for(const error of report.errors||[])errors.push(error.file+': '+error.stage+' failed ('+error.error+')');
   }
   byId('upload-status').textContent=errors.length?'Completed with errors: '+errors.join('; '):'Upload and indexing complete. Documents remain pending. Inspect each source below, then explicitly review and approve.';
   uploadFiles=[];byId('uploads').value='';byId('upload-selection').textContent='No files selected.';await loadSources();
 }catch(error){if(ticket===generation)byId('upload-status').textContent=error.message;}
 finally{clearInterval(timer);uploadBusy=false;if(ticket===generation)byId('upload-submit').disabled=!uploadFiles.length;}
}

function startActivityPoll(ticket){return setInterval(async()=>{if(ticket!==generation||!institutionId)return;try{const activity=await api(adminPath('/activity'));if(ticket===generation&&activity.status==='running')byId('operation-status').textContent=`${activity.file||''} · ${activity.stage} · ${activity.completed}/${activity.total} documents complete`;}catch{}},1500);}
async function operation(path, button) {
  const ticket=generation;const timer=startActivityPoll(ticket);
  button.disabled = true; byId('operation-status').textContent = 'Working…';
  try { const data=await api(adminPath(path),{});if(ticket!==generation)return;byId('operation-status').textContent = JSON.stringify(data,null,2); await Promise.all([loadSources(),refreshHealth()]); }
  catch(error) { if(ticket===generation)byId('operation-status').textContent = error.message; }
  finally { clearInterval(timer);button.disabled = false; }
}
function init() {
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
  document.addEventListener?.('click',event=>{if(event.target.closest('[data-go-home]'))showView('home');});
  byId('advanced-scope').addEventListener('change',()=>{generation++;byId('compare-results').textContent='';byId('bench-content').textContent='';showView(currentView);});
  byId('ask-form').addEventListener('submit',sendQuestion);byId('compare-form').addEventListener('submit',runCompare);
  byId('refresh-bench').addEventListener('click',loadBenchmark);byId('refresh-sources').addEventListener('click',loadSources);
  for(const [id,path] of [['reindex-btn','/reindex'],['clear-cache-btn','/cache/clear']])byId(id).addEventListener('click',event=>operation(path,event.currentTarget));
  byId('institution').addEventListener('change',()=>{byId('student-entry').disabled=!byId('institution').value;studentInstitutionId=byId('institution').value;studentReady=false;if(currentView!=='sources')switchInstitution(studentInstitutionId);});
  byId('admin-institution').addEventListener('change',event=>selectAdmin(event.target.value));
  byId('student-entry').onclick=enterStudent;byId('admin-entry').onclick=()=>showView('sources');
  byId('admin-login').addEventListener('submit',unlockAdmin);byId('create-institution').addEventListener('submit',createWorkspace);
  byId('admin-lock').onclick=()=>{adminToken='';adminInstitutionId='';switchInstitution('');byId('workspace-management').hidden=true;byId('admin-controls').hidden=true;byId('admin-auth-panel').hidden=false;byId('admin-lock').hidden=true;byId('admin-status').textContent='Administration locked. Sign in again to manage workspaces.';};
  byId('upload-form').addEventListener('submit',uploadDocuments);byId('browse-files').onclick=()=>byId('uploads').click();
  byId('uploads').addEventListener('change',event=>chooseFiles(event.target.files));
  const zone=byId('upload-dropzone');
  for(const name of ['dragenter','dragover'])zone.addEventListener(name,event=>{event.preventDefault();zone.classList.toggle('dragging',true);});
  for(const name of ['dragleave','drop'])zone.addEventListener(name,event=>{event.preventDefault();zone.classList.toggle('dragging',false);});
  zone.addEventListener('drop',event=>chooseFiles(event.dataTransfer.files));
  for(const [id,published]of [['publish-btn',true],['unpublish-btn',false]])byId(id).onclick=()=>adminOperation(()=>api(adminPath(),{published,status:'active'},'PATCH'));
  byId('run-benchmark').onclick=()=>adminOperation(()=>api(adminPath('/bench/run'),{}));
  document.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>{byId('question').value=button.dataset.question;byId('question').focus();});
  loadInstitutions().catch(error=>{byId('institution-status').textContent=error.message;});refreshHealth();
}
if(typeof document!=='undefined')init();
if(typeof module!=='undefined')module.exports={escapeHtml,format,table,chunkCard,renderInternals,renderCompare,renderBenchmark,api,sendQuestion,runCompare,loadSources,operation,switchInstitution,showView,enterStudent,loadInstitutions,selectAdmin,chooseFiles,uploadDocuments,checkStudentReadiness,unlockAdmin,createWorkspace};
