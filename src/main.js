(() => {
  'use strict';

  const KEYS = ['members','meetings','tasks','events','attendance','issues','documents'];
  const FILES = Object.fromEntries(KEYS.map(k => [k, `${k}.json`]));
  const LABELS = {members:'Members',meetings:'Meetings',tasks:'Tasks',events:'Programs & Events',attendance:'Attendance',issues:'IT / Assets',documents:'Documents'};
  const MODULES = {
    members:['♙','Members','Profiles, management roles, contact details and member history.'],
    meetings:['▣','Meetings','Agendas, attendees, minutes, decisions and follow-up tasks.'],
    tasks:['✓','Tasks','Assignments, priorities, deadlines and completion tracking.'],
    events:['★','Programs & Events','Plan programs and preserve complete event records.'],
    attendance:['◷','Attendance','Meeting and event attendance across every management term.'],
    assets:['▤','IT / Assets','Track computers, equipment, issues and repair history.'],
    documents:['▱','Documents','One searchable home for reports, proposals, notices and certificates.'],
    reports:['▥','Reports','Generate activity, attendance, event, task and IT reports.'],
    handover:['↗','Handover Center','Transfer the complete institutional record to the next Secretary.'],
    settings:['⚙','Settings','Club settings, roles, permissions and system configuration.']
  };
  const DEFS = {
    member:{key:'members',title:'Member',fields:['Name','Position','Class']},
    meeting:{key:'meetings',title:'Meeting',fields:['Meeting title','Date','Location']},
    task:{key:'tasks',title:'Task',fields:['Task','Assigned to','Deadline']},
    event:{key:'events',title:'Event',fields:['Event name','Date','Venue']},
    attendance:{key:'attendance',title:'Attendance',fields:['Record','Date','Present']},
    issue:{key:'issues',title:'IT Issue',fields:['Asset / PC','Issue','Priority']},
    document:{key:'documents',title:'Document',fields:['Document','Category','Date']}
  };

  // ONE source of truth. No localStorage and no second data engine.
  const store = window.kitcData = window.kitcData || {};
  for (const key of KEYS) if (!Array.isArray(store[key])) store[key] = [];
  let usbRoot = null;
  let current = 'dashboard';
  let searchResults = [];

  const content = document.getElementById('content');
  const toast = document.getElementById('toast');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const notify = text => { if (!toast) return; toast.textContent = text; toast.classList.add('show'); clearTimeout(window.__kitcToast); window.__kitcToast = setTimeout(() => toast.classList.remove('show'), 2400); };
  const keyFor = section => section === 'assets' ? 'issues' : section;
  const typeFor = section => section === 'assets' ? 'issue' : section === 'documents' ? 'document' : section;

  function normalizeRecord(key, record) {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      if (!record.id) record.id = uid();
      return record;
    }
    const a = Array.isArray(record) ? record : [];
    const id = uid();
    if (key === 'members') return {id,name:a[0]||'',role:a[1]||'',class:a[2]||'',status:a[3]||'Active'};
    return {id, values:a};
  }
  function normalizeAll() { for (const key of KEYS) store[key] = store[key].map(r => normalizeRecord(key,r)); }

  async function dbHandle() {
    if (!usbRoot) throw new Error('KITC USB is not connected');
    return usbRoot.getDirectoryHandle('database',{create:true});
  }
  async function readFile(key) {
    const db = await dbHandle();
    try {
      const file = await db.getFileHandle(FILES[key]);
      const parsed = JSON.parse(await (await file.getFile()).text());
      const records = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.[key]) ? parsed[key] : Array.isArray(parsed?.records) ? parsed.records : null;
      if (!records) throw new Error(`${FILES[key]} is not a valid KITC record file`);
      return records.map(r => normalizeRecord(key,r));
    } catch (e) {
      if (e?.name === 'NotFoundError') return [];
      throw e;
    }
  }
  async function writeFile(key) {
    const db = await dbHandle();
    const file = await db.getFileHandle(FILES[key],{create:true});
    const w = await file.createWritable();
    try { await w.write(JSON.stringify(store[key],null,2)); } finally { await w.close(); }
  }
  async function saveKeys(keys=KEYS) {
    if (!usbRoot) { notify('Connect the KITC USB first'); return false; }
    try { for (const key of keys) await writeFile(key); return true; }
    catch (e) { console.error(e); notify(`USB save failed: ${e.message||'Unknown error'}`); return false; }
  }
  window.kitcSaveAll = () => saveKeys();

  async function loadUsb(root) {
    usbRoot = root;
    window.kitcUsbHandle = root;
    try {
      const loaded = {};
      for (const key of KEYS) loaded[key] = await readFile(key);
      for (const key of KEYS) store[key] = loaded[key];
      normalizeAll();
      window.kitcData = store;
      window.kitcDataReady = true;
      render(current);
      notify(`USB records loaded • ${store.members.length} members`);
    } catch (e) {
      window.kitcDataReady = false;
      console.error('KITC USB load failed',e);
      notify(`USB load failed: ${e.message||'Unknown error'}`);
    }
  }
  window.addEventListener('kitc:usb-ready', e => loadUsb(e.detail.handle));

  const head = (k,t,s,a='＋ Add',fn='openAdd()') => `<div class="page-head"><div><div class="eyebrow">${esc(k)}</div><h1>${esc(t)}</h1><p>${esc(s)}</p></div><button class="button primary" onclick="${fn}">${esc(a)}</button></div>`;
  const titleOf = (key,r) => key==='members' ? r.name : r.values?.[0] || r[0] || r.title || r.name || 'KITC Record';
  const valuesOf = (key,r) => key==='members' ? [r.name,r.role,r.class,r.status] : (r.values || []);

  function dashboard() {
    return `${head('KITC • 2026–27','Good afternoon, Anim 👋','Secretary dashboard • USB is the source of truth','＋ Quick Add','openAdd()')}
    <div class="stats">
      <div class="stat"><div class="stat-top">Members <span>↗</span></div><strong>${store.members.length}</strong><span class="trend">Current records</span></div>
      <div class="stat"><div class="stat-top">Pending Tasks <span>!</span></div><strong>${store.tasks.filter(r=>valuesOf('tasks',r)[4]!=='Completed').length}</strong><span class="trend">Follow-up required</span></div>
      <div class="stat"><div class="stat-top">Upcoming Events <span>★</span></div><strong>${store.events.filter(r=>valuesOf('events',r)[3]!=='Completed').length}</strong><span class="trend">Next programs</span></div>
      <div class="stat"><div class="stat-top">Open Issues <span>⌁</span></div><strong>${store.issues.filter(r=>valuesOf('issues',r)[3]!=='Resolved').length}</strong><span class="trend">IT / assets</span></div>
    </div>
    <div class="grid-2"><div class="panel"><div class="panel-head"><h2>Today's priorities</h2><span class="muted">USB records</span></div><div class="list">${store.tasks.slice(0,4).map((r,i)=>{const v=valuesOf('tasks',r);return `<div class="list-row"><div><strong>${esc(v[0])}</strong><small>${esc(v[1])} • due ${esc(v[3])}</small></div><button class="pill action-pill" onclick="cycleTask('${r.id}')">${esc(v[4])}</button></div>`}).join('')}</div></div>
    <div class="panel"><div class="panel-head"><h2>Upcoming</h2><button class="text-button" onclick="render('events')">View all</button></div><div class="list">${store.events.slice(0,3).map(r=>{const v=valuesOf('events',r);return `<div class="list-row"><div><strong>${esc(v[0])}</strong><small>${esc(v[1])} • ${esc(v[2])}</small></div><span class="pill dark">${esc(v[3])}</span></div>`}).join('')}</div></div></div>
    <div class="panel" style="margin-top:16px"><div class="panel-head"><h2>Quick actions</h2><span class="muted">Every change is saved to USB</span></div><div class="quick-add"><button class="button" onclick="openAdd('meeting')">＋ Meeting</button><button class="button" onclick="openAdd('task')">＋ Task</button><button class="button" onclick="openAdd('event')">＋ Event</button><button class="button" onclick="openAdd('issue')">＋ IT Issue</button><button class="button" onclick="openAdd('member')">＋ Member</button></div></div>`;
  }

  function tablePage(section) {
    if (section==='reports') return `${head('Analytics','Reports','Generate reusable reports from USB records','Generate report','generateReport()')}<div class="section-grid">${['Monthly Activity Report','Member Attendance Report','Program History','Pending Task Report','IT Issue Report','Annual Secretary Report'].map(x=>`<article class="module-card" onclick="generateReport('${esc(x)}')"><div class="module-icon">▥</div><h3>${esc(x)}</h3><p>Generate from current USB records.</p></article>`).join('')}</div>`;
    if (section==='handover') return `${head('Continuity','Handover Center','Preserve the complete institutional record between Secretaries','Backup term','backupAll()')}<div class="handover-card"><h2>Secretary Handover</h2><p>Create a complete backup of every KITC record on the USB.</p><button class="button primary" onclick="backupAll()">Create complete USB backup</button></div>`;
    if (section==='settings') return `${head('System','Settings','Club settings, roles, permissions and system configuration')}<div class="panel"><h2>USB storage</h2><p class="muted">${usbRoot?'KITC USB connected ✓':'KITC USB not connected.'}</p></div>`;
    const key = keyFor(section), type = typeFor(section), meta = MODULES[section], def = DEFS[type];
    if (!def) return `${head(meta[0],meta[1],meta[2])}`;
    const rows = store[key];
    const columns = key==='members'?['Name','Position','Class','Status']:key==='tasks'?['Task','Assigned to','Priority','Deadline','Status']:key==='meetings'?['Meeting','Date','Location','Next step']:key==='events'?['Event','Date','Venue','Status']:key==='attendance'?['Record','Date','Present']:key==='issues'?['Asset','Issue','Priority','Status']:['Document','Category','Date'];
    return `${head(meta[0],meta[1],meta[2],`＋ Add ${def.title.toLowerCase()}`,`openAdd('${type}')`)}
      <div class="table-card"><div class="record-toolbar"><label><input type="checkbox" id="selectAllRecords"> Select all</label><span id="selectedCount">0 selected</span><button class="button danger" id="deleteSelected" style="display:none">Delete selected</button></div>
      <table class="table"><thead><tr><th></th>${columns.map(c=>`<th>${esc(c)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>
      ${rows.map(r=>{const vals=valuesOf(key,r);return `<tr><td><input class="record-check" type="checkbox" data-id="${esc(r.id)}"></td>${vals.map(v=>`<td>${esc(v)}</td>`).join('')}<td><div class="record-actions"><button class="text-button" onclick="openAdd('${type}','${esc(r.id)}')">Edit</button><button class="icon-button record-more" type="button" data-id="${esc(r.id)}" aria-label="More actions">⋮</button></div></td></tr>`}).join('')}
      </tbody></table></div>`;
  }

  function render(section='dashboard') {
    current=section; window.kitcCurrentSection=section;
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===section));
    if (content) content.innerHTML = section==='dashboard' ? dashboard() : tablePage(section);
    bindTableActions();
  }
  window.render=render;

  function recordById(type,id){const key=DEFS[type]?.key; return key ? store[key].find(r=>r.id===id) : null;}
  function formValues(type,r){return type==='member' ? [r?.name,r?.role,r?.class] : (r?.values||[]).slice(0,3);}
  window.openAdd = (type='member',id=null) => {
    const def=DEFS[type]; if(!def)return;
    const existing=id?recordById(type,id):null, vals=existing?formValues(type,existing):[];
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><button class="modal-close" onclick="closeModal()">×</button><div class="eyebrow">KITC • 2026–27 • USB</div><h2>${existing?'Edit ':'Add '}${esc(def.title)}</h2><form id="kitcRecordForm">${def.fields.map((f,i)=>`<label>${esc(f)}<input required name="f${i}" value="${esc(vals[i]??'')}" placeholder="${esc(f)}"></label>`).join('')}<button class="button primary" type="submit">Save to USB</button></form></div></div>`);
    document.getElementById('kitcRecordForm').onsubmit=e=>submitRecord(e,type,id);
  };
  window.closeModal=()=>document.getElementById('modal')?.remove();

  async function submitRecord(e,type,id) {
    e.preventDefault(); const def=DEFS[type], key=def.key, f=[...new FormData(e.target).values()], old=id?recordById(type,id):null; let r;
    if(type==='member') r={id:old?.id||uid(),name:f[0],role:f[1],class:f[2],status:old?.status||'Active'};
    else { const oldv=old?.values||[]; if(type==='task')r={id:old?.id||uid(),values:[f[0],f[1],oldv[2]||'Medium',f[2],oldv[4]||'Pending']}; else if(type==='event')r={id:old?.id||uid(),values:[f[0],f[1],f[2],oldv[3]||'Planned']}; else if(type==='meeting')r={id:old?.id||uid(),values:[f[0],f[1],f[2],oldv[3]||'Agenda pending']}; else if(type==='issue')r={id:old?.id||uid(),values:[f[0],f[1],f[2],oldv[3]||'Pending']}; else r={id:old?.id||uid(),values:f}; }
    const index=old?store[key].findIndex(x=>x.id===id):-1; if(index>=0)store[key][index]=r; else store[key].push(r);
    if(await saveKeys([key])){closeModal();render(current);notify(`${def.title} saved to USB ✓`)}
  }

  async function deleteByIds(section,ids) {
    const key=keyFor(section); if(!ids.length)return;
    if(!confirm(`Delete ${ids.length} record${ids.length>1?'s':''} permanently from the KITC USB?`))return;
    const remove=new Set(ids); store[key]=store[key].filter(r=>!remove.has(r.id));
    if(await saveKeys([key])){render(section);notify(`${ids.length} record${ids.length>1?'s':''} deleted from USB ✓`)}
  }

  function bindTableActions() {
    const key=keyFor(current); if(!FILES[key])return;
    const checks=[...document.querySelectorAll('.record-check')], master=document.getElementById('selectAllRecords'), count=document.getElementById('selectedCount'), del=document.getElementById('deleteSelected');
    const selected=()=>checks.filter(c=>c.checked).map(c=>c.dataset.id);
    const update=()=>{const ids=selected();if(count)count.textContent=`${ids.length} selected`;if(del)del.style.display=ids.length?'inline-flex':'none';if(master)master.checked=checks.length>0&&ids.length===checks.length;};
    checks.forEach(c=>c.addEventListener('change',update));
    master?.addEventListener('change',()=>{checks.forEach(c=>c.checked=master.checked);update()});
    del?.addEventListener('click',()=>deleteByIds(current,selected()));
    document.querySelectorAll('.record-more').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openActionMenu(btn)}));
  }
  function openActionMenu(btn) {
    document.querySelectorAll('.record-menu').forEach(x=>x.remove());
    const menu=document.createElement('div'); menu.className='record-menu'; menu.innerHTML=`<button type="button">✏️ Edit</button><button type="button">🗑️ Delete</button>`;
    const r=btn.getBoundingClientRect(); menu.style.position='fixed';menu.style.top=`${r.bottom+4}px`;menu.style.left=`${Math.max(8,r.right-150)}px`;menu.style.zIndex='9999';
    document.body.appendChild(menu); menu.querySelector('button').onclick=()=>{menu.remove();openAdd(typeFor(current),btn.dataset.id)}; menu.querySelectorAll('button')[1].onclick=()=>{menu.remove();deleteByIds(current,[btn.dataset.id])};
    setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0);
  }

  window.cycleTask=async id=>{const r=store.tasks.find(x=>x.id===id);if(!r)return;const states=['Pending','In Progress','Completed'],v=r.values,n=states.indexOf(v[4]);v[4]=states[(n+1)%states.length];if(await saveKeys(['tasks']))render(current)};

  function universalSearch(q) {
    const term=q.trim().toLowerCase(); searchResults=[]; if(!term){renderSearchBox([]);return;}
    for(const key of KEYS) store[key].forEach(r=>{const text=[titleOf(key,r),...valuesOf(key,r)].join(' ').toLowerCase();if(text.includes(term))searchResults.push({key,id:r.id,title:titleOf(key,r),text:valuesOf(key,r).join(' • ')});});
    renderSearchBox(searchResults.slice(0,30));
  }
  function renderSearchBox(results) {
    let box=document.getElementById('universalResults'); if(!box){const input=document.getElementById('globalSearch');if(!input)return;box=document.createElement('div');box.id='universalResults';box.className='universal-results';input.parentElement.appendChild(box);}
    box.innerHTML=results.length?results.map((r,i)=>`<button type="button" class="universal-result" data-result="${i}"><strong>${esc(r.title)}</strong><small>${esc(LABELS[r.key])} • ${esc(r.text)}</small></button>`).join(''):`<div class="universal-empty">No matching KITC records</div>`;
    box.querySelectorAll('.universal-result').forEach(b=>b.onclick=()=>{const r=results[Number(b.dataset.result)];box.remove();render(r.key==='issues'?'assets':r.key);setTimeout(()=>{const row=document.querySelector(`[data-id="${CSS.escape(r.id)}"]`);row?.scrollIntoView({behavior:'smooth',block:'center'});row?.classList.add('search-highlight');},50)});
  }
  function setupSearch(){const input=document.getElementById('globalSearch');if(!input)return;input.addEventListener('input',()=>universalSearch(input.value));input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';renderSearchBox([]);document.getElementById('universalResults')?.remove()}})}

  window.generateReport=async(name='Monthly Activity Report')=>{try{if(!usbRoot)throw new Error('Connect the KITC USB first');const dir=await usbRoot.getDirectoryHandle('reports',{create:true});const f=await dir.getFileHandle(`${name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.json`,{create:true});const w=await f.createWritable();await w.write(JSON.stringify({report:name,generatedAt:new Date().toISOString(),data:store},null,2));await w.close();notify(`${name} saved to USB ✓`)}catch(e){notify(`Report failed: ${e.message||'Unknown error'}`)}};
  window.backupAll=async()=>{try{if(!usbRoot)throw new Error('Connect the KITC USB first');const dir=await usbRoot.getDirectoryHandle('backups',{create:true});const f=await dir.getFileHandle(`kitc-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,{create:true});const w=await f.createWritable();await w.write(JSON.stringify(store,null,2));await w.close();notify('Complete KITC backup saved ✓')}catch(e){notify(`Backup failed: ${e.message||'Unknown error'}`)}};

  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{render(b.dataset.section);document.getElementById('sidebar')?.classList.remove('open')}));
  document.getElementById('menuButton')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
  document.querySelector('.profile')?.addEventListener('click',()=>notify('Secretary profile • USB-secured KITC access'));
  document.querySelector('.top-actions .icon-button')?.addEventListener('click',()=>notify('KITC system status • USB data store'));
  setupSearch();
  render('dashboard');
})();