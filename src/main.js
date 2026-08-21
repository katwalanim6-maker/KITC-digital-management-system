(() => {
  const KEYS=['members','meetings','tasks','events','attendance','issues','documents'];
  const FILES=Object.fromEntries(KEYS.map(k=>[k,`${k}.json`]));
  const LABELS={members:'Members',meetings:'Meetings',tasks:'Tasks',events:'Programs & Events',attendance:'Attendance',issues:'IT / Assets',documents:'Documents'};
  const SEED={members:[{name:'Anim Katwal',role:'Secretary',class:'Management',status:'Active'}],meetings:[],tasks:[],events:[],attendance:[],issues:[],documents:[]};
  const store=window.kitcData=window.kitcData||{};
  for(const k of KEYS) if(!Array.isArray(store[k])) store[k]=[];
  const content=document.getElementById('content');
  const toast=document.getElementById('toast');
  let usbRoot=null,current='dashboard',searchTimer=null;

  function notify(text){if(!toast)return;toast.textContent=text;toast.classList.add('show');clearTimeout(searchTimer);searchTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function activeSection(){return document.querySelector('.nav-item.active')?.dataset.section||current}
  function recordKey(section){return section==='assets'?'issues':section}
  function recordTitle(r){if(r&&typeof r==='object')return r.name||r.title||r[0]||'KITC Record';return String(r)}
  function recordText(r){return typeof r==='object'?Object.values(r).map(v=>String(v)).join(' • '):String(r)}

  async function writeJson(key,records=store[key]){
    if(!usbRoot)throw new Error('KITC USB is not connected');
    const db=await usbRoot.getDirectoryHandle('database',{create:true});
    const h=await db.getFileHandle(FILES[key],{create:true});
    const w=await h.createWritable();
    try{await w.write(JSON.stringify(records,null,2))}finally{await w.close()}
  }
  async function readJson(key){
    if(!usbRoot)throw new Error('KITC USB is not connected');
    try{
      const db=await usbRoot.getDirectoryHandle('database');
      const h=await db.getFileHandle(FILES[key]);
      const parsed=JSON.parse(await(await h.getFile()).text());
      if(Array.isArray(parsed))return parsed;
      if(parsed&&Array.isArray(parsed[key]))return parsed[key];
      if(parsed&&Array.isArray(parsed.records))return parsed.records;
      throw new Error(`${FILES[key]} has an unsupported format`);
    }catch(e){
      if(e?.name==='NotFoundError')return JSON.parse(JSON.stringify(SEED[key]||[]));
      throw e;
    }
  }
  async function loadUsb(root){
    usbRoot=root;window.kitcUsbHandle=root;
    try{
      const loaded={};
      for(const k of KEYS)loaded[k]=await readJson(k);
      for(const k of KEYS)store[k]=loaded[k];
      window.kitcData=store;
      render(current);
      notify(`USB records loaded • ${store.members.length} members`);
    }catch(e){console.error('KITC USB load failed',e);notify(`USB load failed: ${e.message||'Unknown error'}`)}
  }
  async function saveAll(){
    if(!usbRoot){notify('Connect the KITC USB first');return false}
    try{for(const k of KEYS)await writeJson(k);return true}
    catch(e){console.error('KITC USB save failed',e);notify(`USB save failed: ${e.message||'Unknown error'}`);return false}
  }
  window.kitcSaveAll=saveAll;

  const modules={
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
  const defs={
    member:{key:'members',title:'Member',fields:['Name','Position','Class']},
    meeting:{key:'meetings',title:'Meeting',fields:['Meeting title','Date','Location']},
    task:{key:'tasks',title:'Task',fields:['Task','Assigned to','Deadline']},
    event:{key:'events',title:'Event',fields:['Event name','Date','Venue']},
    attendance:{key:'attendance',title:'Attendance',fields:['Record','Date','Present']},
    issue:{key:'issues',title:'IT Issue',fields:['Asset / PC','Issue','Priority']},
    document:{key:'documents',title:'Document',fields:['Document','Category','Date']}
  };
  const head=(k,t,s,a='＋ Add',fn='openAdd()')=>`<div class="page-head"><div><div class="eyebrow">${escapeHtml(k)}</div><h1>${escapeHtml(t)}</h1><p>${escapeHtml(s)}</p></div><button class="button primary" onclick="${fn}">${escapeHtml(a)}</button></div>`;
  function dashboard(){return `${head('KITC • 2026–27','Good afternoon, Anim 👋','Secretary dashboard • every record is stored on the connected KITC USB','＋ Quick Add','openAdd()')}<div class="stats"><div class="stat"><div class="stat-top">Members <span>↗</span></div><strong>${store.members.length}</strong><span class="trend">Active this term</span></div><div class="stat"><div class="stat-top">Pending Tasks <span>!</span></div><strong>${store.tasks.filter(x=>x[4]!=='Completed').length}</strong><span class="trend">Follow-up required</span></div><div class="stat"><div class="stat-top">Upcoming Events <span>★</span></div><strong>${store.events.filter(x=>x[3]!=='Completed').length}</strong><span class="trend">Next program</span></div><div class="stat"><div class="stat-top">Open Issues <span>⌁</span></div><strong>${store.issues.filter(x=>x[3]!=='Resolved').length}</strong><span class="trend">IT / assets</span></div></div><div class="grid-2"><div class="panel"><div class="panel-head"><h2>Today's priorities</h2><span class="muted">USB records</span></div><div class="list">${store.tasks.slice(0,4).map((t,i)=>`<div class="list-row"><div><strong>${escapeHtml(t[0])}</strong><small>${escapeHtml(t[1])} • due ${escapeHtml(t[3])}</small></div><button class="pill action-pill" onclick="cycleTask(${i})">${escapeHtml(t[4])}</button></div>`).join('')}</div></div><div class="panel"><div class="panel-head"><h2>Upcoming</h2><button class="text-button" onclick="render('events')">View all</button></div><div class="list">${store.events.slice(0,3).map(e=>`<div class="list-row"><div><strong>${escapeHtml(e[0])}</strong><small>${escapeHtml(e[1])} • ${escapeHtml(e[2])}</small></div><span class="pill dark">${escapeHtml(e[3])}</span></div>`).join('')}</div></div></div><div class="panel" style="margin-top:16px"><div class="panel-head"><h2>Quick actions</h2><span class="muted">Saved directly to USB</span></div><div class="quick-add"><button class="button" onclick="openAdd('meeting')">＋ Meeting</button><button class="button" onclick="openAdd('task')">＋ Task</button><button class="button" onclick="openAdd('event')">＋ Event</button><button class="button" onclick="openAdd('issue')">＋ IT Issue</button><button class="button" onclick="openAdd('member')">＋ Member</button></div></div>`}

  function tablePage(section){
    if(section==='reports')return `${head('Analytics','Reports','Generate reusable reports from the USB records','Generate report','generateReport()')}<div class="section-grid">${['Monthly Activity Report','Member Attendance Report','Program History','Pending Task Report','IT Issue Report','Annual Secretary Report'].map(x=>`<article class="module-card" onclick="generateReport('${escapeHtml(x)}')"><div class="module-icon">▥</div><h3>${escapeHtml(x)}</h3><p>Generate a report from the current USB data.</p></article>`).join('')}</div>`;
    if(section==='handover')return `${head('Continuity','Handover Center','Preserve the complete institutional record between Secretaries','Backup term','backupAll()')}<div class="handover-card"><h2>Secretary Handover</h2><p>Create a complete backup of every KITC record on the USB before transferring the system.</p><button class="button primary" onclick="backupAll()">Create complete USB backup</button></div>`;
    if(section==='settings')return `${head('System','Settings','Club settings, roles, permissions and system configuration')}<div class="panel"><h2>USB storage</h2><p class="muted">The connected KITC USB is the source of truth. ${usbRoot?'USB connected ✓':'USB not connected.'}</p></div>`;
    const key=recordKey(section),m=modules[section],d=defs[section==='assets'?'issue':section==='documents'?'document':section];
    if(!d)return `${head(m[0],m[1],m[2])}<div class="section-grid"></div>`;
    const rows=store[d.key];
    const vals=r=>section==='members'?[r.name,r.role,r.class,r.status]:section==='meetings'?[r[0],r[1],r[2],r[3]]:section==='tasks'?[r[0],r[1],r[2],r[3],r[4]]:section==='events'?[r[0],r[1],r[2],r[3]]:section==='attendance'?[r[0],r[1],r[2]]:section==='assets'?[r[0],r[1],r[2],r[3]]:[r[0],r[1],r[2]];
    const columns=section==='members'?['Name','Position','Class','Status']:section==='tasks'?['Task','Assigned to','Priority','Deadline','Status']:section==='meetings'?['Meeting','Date','Location','Next step']:section==='events'?['Event','Date','Venue','Status']:section==='attendance'?['Record','Date','Present']:section==='assets'?['Asset','Issue','Priority','Status']:['Document','Category','Date'];
    return `${head(m[0],m[1],m[2],`＋ Add ${d.title.toLowerCase()}`,`openAdd('${section==='assets'?'issue':section==='documents'?'document':section}')`)}<div class="table-card"><div class="record-toolbar"><label><input type="checkbox" id="selectAllRecords"> Select all</label><span id="selectedCount">0 selected</span><button class="button danger" id="deleteSelected" style="display:none">Delete selected</button></div><table class="table"><thead><tr><th></th>${columns.map(c=>`<th>${c}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map((r,i)=>{const v=vals(r);return `<tr><td><input class="record-check" type="checkbox" data-index="${i}"></td>${v.map(x=>`<td>${escapeHtml(x)}</td>`).join('')}<td><div class="record-actions"><button class="text-button" onclick="openAdd('${section==='assets'?'issue':section==='documents'?'document':section}',${i})">Edit</button><button class="icon-button record-more" type="button" data-index="${i}" aria-label="More actions">⋮</button></div></td></tr>`}).join('')}</tbody></table></div>`;
  }

  function render(section='dashboard'){
    current=section;window.kitcCurrentSection=section;
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===section));
    if(content)content.innerHTML=section==='dashboard'?dashboard():tablePage(section);
    bindRecordActions();
  }
  window.render=render;

  function valuesFor(type,index){const d=defs[type],x=store[d.key][index];if(!x)return[];if(type==='member')return[x.name,x.role,x.class];return x.slice(0,3)}
  window.openAdd=(type='member',index=-1)=>{const d=defs[type];if(!d)return;const v=index>=0?valuesFor(type,index):[];document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><button class="modal-close" onclick="closeModal()">×</button><div class="eyebrow">KITC • 2026–27 • USB</div><h2>${index>=0?'Edit ':'Add '}${escapeHtml(d.title)}</h2><form id="kitcRecordForm">${d.fields.map((f,i)=>`<label>${escapeHtml(f)}<input required name="f${i}" value="${escapeHtml(v[i]??'')}" placeholder="${escapeHtml(f)}"></label>`).join('')}<button class="button primary" type="submit">Save to USB</button></form></div></div>`);document.getElementById('kitcRecordForm').onsubmit=e=>submitRecord(e,type,index)};
  window.closeModal=()=>document.getElementById('modal')?.remove();
  async function submitRecord(e,type,index){e.preventDefault();const d=defs[type],f=[...new FormData(e.target).values()];let value;if(type==='member')value={name:f[0],role:f[1],class:f[2],status:index>=0?store.members[index].status:'Active'};else if(type==='task')value=[f[0],f[1],index>=0?store.tasks[index][2]:'Medium',f[2],index>=0?store.tasks[index][4]:'Pending'];else if(type==='event')value=[f[0],f[1],f[2],index>=0?store.events[index][3]:'Planned'];else if(type==='meeting')value=[f[0],f[1],f[2],index>=0?store.meetings[index][3]:'Agenda pending'];else if(type==='issue')value=[f[0],f[1],f[2],index>=0?store.issues[index][3]:'Pending'];else value=f;if(index>=0)store[d.key][index]=value;else store[d.key].push(value);if(await saveAll()){closeModal();render(current);notify(`${d.title} saved to USB ✓`)}}
  async function deleteRecords(section,indices){const key=recordKey(section);if(!store[key]||!indices.length)return;if(!confirm(`Delete ${indices.length} record${indices.length>1?'s':''} from the KITC USB?`))return;const remove=new Set(indices);store[key]=store[key].filter((_,i)=>!remove.has(i));if(await saveAll()){render(section);notify(`${indices.length} record${indices.length>1?'s':''} deleted from USB ✓`)}}
  function bindRecordActions(){
    const section=current;if(!FILES[recordKey(section)])return;
    const checks=[...document.querySelectorAll('.record-check')],master=document.getElementById('selectAllRecords'),count=document.getElementById('selectedCount'),del=document.getElementById('deleteSelected');
    const update=()=>{const selected=checks.filter(x=>x.checked).map(x=>Number(x.dataset.index));if(count)count.textContent=`${selected.length} selected`;if(del)del.style.display=selected.length?'inline-flex':'none';if(master)master.checked=checks.length>0&&selected.length===checks.length};
    checks.forEach(c=>c.addEventListener('change',update));
    master?.addEventListener('change',()=>{checks.forEach(c=>c.checked=master.checked);update()});
    del?.addEventListener('click',()=>deleteRecords(section,checks.filter(x=>x.checked).map(x=>Number(x.dataset.index))));
    document.querySelectorAll('.record-more').forEach(btn=>btn.addEventListener('click',()=>{const menu=document.createElement('div');menu.style.cssText='position:absolute;right:0;top:34px;z-index:50;background:#fff;border:1px solid #ddd;border-radius:10px;padding:5px;box-shadow:0 10px 30px rgba(0,0,0,.15)';menu.innerHTML='<button class="text-button" style="display:block;width:100%;text-align:left;padding:8px" data-edit>Edit</button><button class="text-button" style="display:block;width:100%;text-align:left;padding:8px;color:#b42318" data-del>Delete</button>';const wrap=document.createElement('span');wrap.style.cssText='position:relative;display:inline-block';btn.replaceWith(wrap);wrap.appendChild(btn);wrap.appendChild(menu);btn.onclick=()=>{document.querySelectorAll('.record-actions span div').forEach(x=>{if(x!==menu)x.remove()});menu.style.display=menu.style.display==='none'?'block':'none'};menu.querySelector('[data-edit]').onclick=()=>openAdd(section==='assets'?'issue':section==='documents'?'document':section,Number(btn.dataset.index));menu.querySelector('[data-del]').onclick=()=>deleteRecords(section,[Number(btn.dataset.index)]);btn.click()}));
  }

  function ensureSearch(){if(document.getElementById('kitcSearchOverlay'))return;const o=document.createElement('div');o.id='kitcSearchOverlay';o.style.cssText='position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.35);padding:70px 16px 20px;display:none';o.innerHTML='<div style="max-width:850px;margin:auto;background:#fff;border-radius:16px;max-height:80vh;overflow:auto"><div style="padding:16px;display:flex;justify-content:space-between;border-bottom:1px solid #eee"><strong>Universal KITC Search</strong><button id="closeKitcSearch" class="text-button">Close</button></div><div id="kitcSearchResults"></div></div>';document.body.appendChild(o);document.getElementById('closeKitcSearch').onclick=()=>o.style.display='none'}
  async function universalSearch(q){if(!usbRoot){notify('Connect the KITC USB to search');return}q=q.trim().toLowerCase();if(!q)return;ensureSearch();const o=document.getElementById('kitcSearchOverlay'),list=document.getElementById('kitcSearchResults');o.style.display='block';list.innerHTML='<div style="padding:30px;text-align:center">Searching USB…</div>';const results=[];for(const k of KEYS){store[k]=await readJson(k);store[k].forEach((r,i)=>{if(JSON.stringify(r).toLowerCase().includes(q))results.push({key:k,index:i,r})})}list.innerHTML=results.length?results.map(x=>`<div class="search-result" style="padding:14px 16px;border-bottom:1px solid #eee;cursor:pointer"><strong>${escapeHtml(recordTitle(x.r))}</strong><small style="display:block;color:#667085">${escapeHtml(LABELS[x.key])} • ${escapeHtml(recordText(x.r))}</small></div>`).join(''):'<div style="padding:30px;text-align:center;color:#667085">No KITC records found.</div>';[...list.querySelectorAll('.search-result')].forEach((el,i)=>el.onclick=()=>{o.style.display='none';render(results[i].key==='issues'?'assets':results[i].key)})}
  function generateReport(name='Monthly Activity Report'){if(!usbRoot)return notify('Connect the KITC USB first');const safe=name.replace(/[^a-z0-9]+/gi,'-').toLowerCase();usbRoot.getDirectoryHandle('reports',{create:true}).then(d=>d.getFileHandle(`${safe}.json`,{create:true})).then(h=>h.createWritable().then(async w=>{await w.write(JSON.stringify({report:name,generatedAt:new Date().toISOString(),...store},null,2));await w.close();notify('Report saved to USB ✓')})).catch(e=>notify(`Report failed: ${e.message}`))}
  function backupAll(){if(!usbRoot)return notify('Connect the KITC USB first');usbRoot.getDirectoryHandle('backups',{create:true}).then(d=>d.getFileHandle(`kitc-backup-${Date.now()}.json`,{create:true})).then(h=>h.createWritable().then(async w=>{await w.write(JSON.stringify(store,null,2));await w.close();notify('Complete KITC backup saved to USB ✓')})).catch(e=>notify(`Backup failed: ${e.message}`))}
  window.cycleTask=async i=>{const states=['Pending','In Progress','Completed'],n=states.indexOf(store.tasks[i][4]);store.tasks[i][4]=states[(n+1)%states.length];if(await saveAll())render(current)};
  window.generateReport=generateReport;window.backupAll=backupAll;

  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{render(b.dataset.section);document.getElementById('sidebar')?.classList.remove('open')}));
  document.getElementById('menuButton')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
  document.querySelector('.profile')?.addEventListener('click',()=>notify('Signed in as Anim • Secretary'));
  document.querySelector('.icon-button')?.addEventListener('click',()=>notify('KITC notifications are ready'));
  document.getElementById('globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();universalSearch(e.target.value)}});
  window.addEventListener('kitc:usb-ready',e=>loadUsb(e.detail?.handle));
  render('dashboard');
})();