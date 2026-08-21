(() => {
  let usbRoot = null;
  const map = {members:'members.json',meetings:'meetings.json',tasks:'tasks.json',events:'events.json',attendance:'attendance.json',assets:'issues.json',documents:'documents.json'};
  const labels = {members:'Members',meetings:'Meetings',tasks:'Tasks',events:'Events',attendance:'Attendance',assets:'IT / Assets',documents:'Documents'};
  const state = {selected:new Set(), key:null};

  const css = `
    .record-tools{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(127,127,127,.15);flex-wrap:wrap}
    .record-tools .select-all{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}
    .record-tools .selection-count{font-size:13px;color:#667085}
    .record-tools .bulk-delete{margin-left:auto;border:0;border-radius:9px;padding:9px 13px;background:#b42318;color:#fff;font-weight:700;cursor:pointer;display:none}
    .record-select{width:16px;height:16px;cursor:pointer}
    .record-menu{position:relative;display:inline-block}
    .record-menu>button{border:0;background:transparent;font-size:20px;line-height:1;padding:4px 8px;border-radius:8px;cursor:pointer}
    .record-menu>button:hover{background:rgba(127,127,127,.12)}
    .record-menu-popup{display:none;position:absolute;right:0;top:32px;z-index:20;min-width:120px;background:#fff;border:1px solid #e4e7ec;border-radius:10px;box-shadow:0 10px 30px rgba(16,24,40,.15);padding:5px}
    .record-menu.open .record-menu-popup{display:block}
    .record-menu-popup button{display:block;width:100%;border:0;background:none;text-align:left;padding:9px 10px;border-radius:7px;cursor:pointer}
    .record-menu-popup button:hover{background:#f2f4f7}
    .record-menu-popup .danger{color:#b42318}
    .search-results{position:fixed;inset:0;z-index:999;background:rgba(16,24,40,.35);display:none;padding:70px 16px 20px}
    .search-results.show{display:block}
    .search-results-panel{max-width:850px;margin:auto;background:#fff;border-radius:16px;max-height:80vh;overflow:auto;box-shadow:0 20px 60px rgba(16,24,40,.25)}
    .search-results-head{position:sticky;top:0;background:#fff;padding:16px;border-bottom:1px solid #eaecf0;display:flex;justify-content:space-between;align-items:center}
    .search-result{padding:13px 16px;border-bottom:1px solid #f2f4f7;cursor:pointer}
    .search-result:hover{background:#f9fafb}
    .search-result strong{display:block}.search-result small{color:#667085}
    .search-empty{padding:30px 16px;text-align:center;color:#667085}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  function activeKey(){const active=document.querySelector('.nav-item.active');return active?.dataset.section||null}
  async function readJson(file){if(!usbRoot)throw new Error('KITC USB is not connected');const dir=await usbRoot.getDirectoryHandle('database');const h=await dir.getFileHandle(file);return JSON.parse(await (await h.getFile()).text())}
  async function writeJson(file,value){if(!usbRoot)throw new Error('KITC USB is not connected');const dir=await usbRoot.getDirectoryHandle('database',{create:true});const h=await dir.getFileHandle(file,{create:true});const w=await h.createWritable();await w.write(JSON.stringify(value,null,2));await w.close()}
  function rowText(row){return (row.innerText||'').trim().toLowerCase()}
  function addCell(row,html){const cell=document.createElement('td');cell.innerHTML=html;row.insertBefore(cell,row.firstElementChild);return cell}
  function decorateTable(){
    const key=activeKey(); if(!map[key]) return;
    const table=document.querySelector('.table-card table'); if(!table)return;
    const tbody=table.querySelector('tbody'); if(!tbody)return;
    state.key=key; state.selected.clear();
    const toolbar=table.closest('.table-card').querySelector('.record-tools'); if(!toolbar){
      const card=table.closest('.table-card');
      const bar=document.createElement('div');bar.className='record-tools';bar.innerHTML=`<label class="select-all"><input class="select-all-box" type="checkbox"> Select all</label><span class="selection-count">0 selected</span><button class="bulk-delete">Delete selected</button>`;card.insertBefore(bar,table);
      bar.querySelector('.select-all-box').onchange=e=>{tbody.querySelectorAll('.record-select').forEach((box,i)=>{box.checked=e.target.checked; if(e.target.checked)state.selected.add(i);else state.selected.delete(i)});updateToolbar(bar)};
      bar.querySelector('.bulk-delete').onclick=()=>deleteSelected();
    }
    tbody.querySelectorAll('tr').forEach((row,i)=>{
      if(row.querySelector('.record-select'))return;
      addCell(row,`<input class="record-select" type="checkbox" data-index="${i}" aria-label="Select record">`);
      const last=row.lastElementChild; const actionCell=last;
      if(!actionCell.querySelector('.record-menu')){
        const menu=document.createElement('div');menu.className='record-menu';menu.innerHTML=`<button type="button" aria-label="More actions">⋮</button><div class="record-menu-popup"><button type="button" data-edit>Edit</button><button type="button" class="danger" data-delete>Delete</button></div>`;
        actionCell.appendChild(menu);
        menu.querySelector('[data-edit]')?.addEventListener('click',()=>{menu.classList.remove('open');const edit=row.querySelector('.text-button');if(edit)edit.click()});
        menu.querySelector('[data-delete]')?.addEventListener('click',()=>{menu.classList.remove('open');deleteIndices([i])});
        menu.firstElementChild.onclick=()=>{document.querySelectorAll('.record-menu.open').forEach(x=>x!==menu&&x.classList.remove('open'));menu.classList.toggle('open')};
      }
      row.querySelector('.record-select').onchange=e=>{if(e.target.checked)state.selected.add(i);else state.selected.delete(i);updateToolbar(table.closest('.table-card').querySelector('.record-tools'))};
    });
  }
  function updateToolbar(bar){if(!bar)return;bar.querySelector('.selection-count').textContent=`${state.selected.size} selected`;bar.querySelector('.bulk-delete').style.display=state.selected.size?'block':'none';const boxes=[...document.querySelectorAll('.record-select')];const all=boxes.length>0&&boxes.every(x=>x.checked);const master=bar.querySelector('.select-all-box');if(master)master.checked=all}
  async function deleteIndices(indices){
    if(!usbRoot){notify('Connect the KITC USB first');return}
    const key=state.key||activeKey();const file=map[key];if(!file)return;
    if(!confirm(`Delete ${indices.length} selected record${indices.length>1?'s':''}? This will remove them from the KITC USB.`))return;
    try{const records=await readJson(file);const remove=new Set(indices);const next=records.filter((_,i)=>!remove.has(i));await writeJson(file,next);notify(`${indices.length} record${indices.length>1?'s':''} deleted from USB ✓`);location.reload()}catch(e){console.error(e);notify(`Delete failed: ${e.message||'Unknown error'}`)}
  }
  function deleteSelected(){deleteIndices([...state.selected])}

  function ensureSearchUI(){
    if(document.getElementById('universalSearchResults'))return;
    const overlay=document.createElement('div');overlay.id='universalSearchResults';overlay.className='search-results';overlay.innerHTML=`<div class="search-results-panel"><div class="search-results-head"><strong>Universal KITC Search</strong><button class="text-button" id="closeUniversalSearch">Close</button></div><div id="universalSearchList"></div></div>`;document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('show')});document.getElementById('closeUniversalSearch').onclick=()=>overlay.classList.remove('show');
  }
  async function universalSearch(q){
    if(!usbRoot){notify('Connect the KITC USB to search all records');return}
    q=q.trim().toLowerCase();if(!q)return;
    ensureSearchUI();const list=document.getElementById('universalSearchList');list.innerHTML='<div class="search-empty">Searching USB records…</div>';document.getElementById('universalSearchResults').classList.add('show');
    const results=[];
    for(const [key,file] of Object.entries(map)){try{const rows=await readJson(file);rows.forEach((record,index)=>{const text=JSON.stringify(record).toLowerCase();if(text.includes(q))results.push({key,index,record})})}catch(e){}}
    list.innerHTML=results.length?results.map(r=>`<div class="search-result" data-key="${r.key}" data-index="${r.index}"><strong>${escapeHtml(recordTitle(r.record))}</strong><small>${labels[r.key]} • ${escapeHtml(flatten(r.record))}</small></div>`).join(''):'<div class="search-empty">No KITC records found.</div>';
    list.querySelectorAll('.search-result').forEach(el=>el.onclick=()=>{document.getElementById('universalSearchResults').classList.remove('show');const nav=document.querySelector(`.nav-item[data-section="${el.dataset.key}"]`);if(nav)nav.click()});
  }
  function flatten(r){return typeof r==='object'?Object.values(r).filter(v=>typeof v!=='object').join(' • '):String(r)}
  function recordTitle(r){if(r&&typeof r==='object')return r.name||r.title||r[0]||'KITC Record';return String(r)}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function notify(text){const t=document.getElementById('toast');if(t){t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}}

  document.addEventListener('click',e=>{if(!e.target.closest('.record-menu'))document.querySelectorAll('.record-menu.open').forEach(x=>x.classList.remove('open'))});
  window.addEventListener('kitc:usb-ready',e=>{usbRoot=e.detail.handle;setTimeout(decorateTable,250)});
  const content=document.getElementById('content');if(content)new MutationObserver(()=>decorateTable()).observe(content,{childList:true,subtree:true});
  const search=document.getElementById('globalSearch');if(search){search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();universalSearch(search.value)}})}
  setInterval(()=>{if(usbRoot)decorateTable()},1000);
})();
