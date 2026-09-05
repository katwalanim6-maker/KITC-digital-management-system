(() => {
  'use strict';

  const RESOURCES = {
    members: { label: 'Members', singular: 'Member', columns: [['name','Name'],['role','Position'],['class','Class'],['status','Status']] },
    meetings: { label: 'Meetings', singular: 'Meeting', columns: [['title','Meeting'],['date','Date'],['location','Location'],['nextStep','Next step']] },
    tasks: { label: 'Tasks', singular: 'Task', columns: [['task','Task'],['assignedTo','Assigned to'],['priority','Priority'],['deadline','Deadline'],['status','Status']] },
    events: { label: 'Programs & Events', singular: 'Event', columns: [['name','Event'],['date','Date'],['venue','Venue'],['status','Status']] },
    attendance: { label: 'Attendance', singular: 'Attendance', columns: [['record','Record'],['date','Date'],['present','Present']] },
    issues: { label: 'IT / Assets', singular: 'IT Issue', columns: [['asset','Asset'],['issue','Issue'],['priority','Priority'],['status','Status']] },
    documents: { label: 'Documents', singular: 'Document', columns: [['document','Document'],['category','Category'],['date','Date']] }
  };
  const resources = Object.entries(RESOURCES).map(([id,r]) => ({id,label:r.label,singular:r.singular,columns:r.columns.map(([key,label])=>({key,label})),fields:r.columns.map(([key,label])=>({key,label,required:false}))}));
  const uid = () => globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const data = () => window.kitcData || {};
  const save = async key => { if(typeof window.kitcSave !== 'function') throw new Error('KITC USB storage is not ready'); if(!await window.kitcSave(key)) throw new Error('KITC USB save failed'); };

  const adapter = {
    async list(resource){ return Array.isArray(data()[resource]) ? data()[resource].map(r=>({...r})) : []; },
    async create(resource,payload){ data()[resource]=Array.isArray(data()[resource])?data()[resource]:[]; data()[resource].push({id:uid(),...payload}); await save(resource); },
    async update(resource,id,payload){ const rows=data()[resource]||[], i=rows.findIndex(r=>String(r.id)===String(id)); if(i<0)throw new Error('Record not found'); data()[resource][i]={...rows[i],...payload,id:rows[i].id}; await save(resource); },
    async delete(resource,id){ data()[resource]=(data()[resource]||[]).filter(r=>String(r.id)!==String(id)); await save(resource); }
  };
  window.kitcAdminAdapter=adapter;
  window.kitcAdminResources=resources;

  async function reloadUsb(){
    const root=window.kitcUsbHandle; if(!root)return false;
    const dir=await root.getDirectoryHandle('database',{create:true});
    for(const key of Object.keys(RESOURCES)){
      try{
        const file=await dir.getFileHandle(`${key}.json`);
        const raw=JSON.parse(await(await file.getFile()).text());
        let rows=Array.isArray(raw)?raw:(Array.isArray(raw[key])?raw[key]:(Array.isArray(raw.records)?raw.records:[]));
        if(key==='members')rows=rows.map(r=>Array.isArray(r)?{id:uid(),name:r[0]||'',role:r[1]||'',class:r[2]||'',status:r[3]||'Active'}:{...r,id:r.id||uid(),name:r.name||r.fullName||r.memberName||'',role:r.role||r.position||'',class:r.class||r.className||'',status:r.status||'Active'});
        data()[key]=rows;
      }catch(error){ if(error.name!=='NotFoundError')throw error; data()[key]=[]; }
    }
    window.kitcDataReady=true; return true;
  }
  window.kitcReloadUsb=reloadUsb;

  let signatureValue=''; let timerStarted=false;
  async function signature(){
    const root=window.kitcUsbHandle;if(!root)return '';
    const dir=await root.getDirectoryHandle('database',{create:true}), parts=[];
    for(const key of Object.keys(RESOURCES))try{const f=await(await dir.getFileHandle(`${key}.json`)).getFile();parts.push(`${key}:${f.lastModified}:${f.size}`)}catch{parts.push(`${key}:missing`)}
    return parts.join('|');
  }
  async function poll(){const next=await signature();if(signatureValue&&next!==signatureValue){try{await reloadUsb();window.dispatchEvent(new CustomEvent('kitc:admin-data-refresh'));}catch(e){console.error('[KITC] USB refresh failed',e)}}signatureValue=next;}
  window.addEventListener('kitc:usb-ready',async()=>{signatureValue=await signature();if(!timerStarted){timerStarted=true;setInterval(()=>poll().catch(console.error),2000)}},{once:true});

  function openPanel(){
    if(!window.UniversalAdminPanel){console.error('[KITC] Universal Admin Panel failed to load');return;}
    if(!window.kitcUsbHandle){alert('Connect and unlock the KITC Secretary USB first.');return;}
    const host=document.getElementById('kitcAdminPanel');if(!host)return;
    host.hidden=false;host.innerHTML='';
    const panel=window.UniversalAdminPanel.mount(host,{version:'2.0.0',brand:'KITC',subtitle:'Secretary Admin',logo:'K',accent:'#2563eb',user:{name:'Secretary',role:'USB Admin'},sectionLabel:'KITC • ADMIN',navigation:[
      {id:'dashboard',label:'Dashboard',icon:'⌂'},{id:'members',label:'Members',icon:'♙'},{id:'meetings',label:'Meetings',icon:'▣'},{id:'tasks',label:'Tasks',icon:'✓'},{id:'events',label:'Programs & Events',icon:'★'},{id:'attendance',label:'Attendance',icon:'◷'},{id:'documents',label:'Documents',icon:'▱'},{id:'issues',label:'IT / Assets',icon:'▤'}
    ],resources,permissions:{read:true,create:true,update:true,delete:true},adapter,stats:Object.keys(RESOURCES).slice(0,4).map(k=>({label:RESOURCES[k].label,value:data()[k]?.length||0,note:'USB records'})),actions:[{label:'Refresh USB',primary:true,onClick:async p=>{await reloadUsb();p.navigate(p.active)}}]});
    window.kitcAdminPanel=panel;window.dispatchEvent(new CustomEvent('kitc:admin-opened'));
  }
  window.openKitcAdmin=openPanel;
  document.addEventListener('click',e=>{if(e.target.closest('[data-open-kitc-admin]'))openPanel();if(e.target.closest('[data-close-kitc-admin]')){document.getElementById('kitcAdminPanel')?.setAttribute('hidden','');window.kitcAdminPanel?.destroy?.();}});
})();
