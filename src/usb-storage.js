(() => {
  const DB_FILES = ['members','meetings','tasks','events','attendance','issues','documents'];
  const seeds = {
    members: [{name:'Anim Katwal',role:'Secretary',class:'Management',status:'Active'},{name:'Prashna Rai',role:'President',class:'Management',status:'Active'},{name:'Aayush Shrestha',role:'Vice-President',class:'Management',status:'Active'},{name:'Sujal Karki',role:'Member',class:'12 A',status:'Active'}],
    tasks: [['Prepare management meeting agenda','Anim Katwal','High','Aug 25','In Progress'],['Inspect computer lab','Aayush Shrestha','Medium','Aug 24','Pending'],['Upload installation report','Sujal Karki','Low','Aug 28','Pending']],
    events: [['IT Workshop 2026','Aug 28','Computer Lab','Upcoming'],['New Member Orientation','Sep 03','Auditorium','Planned'],['Installation Program','Aug 12','KITC Hall','Completed']],
    issues: [['PC-27','Keyboard not working','Medium','Pending'],['PC-14','Display cable issue','Low','Resolved']],
    meetings: [['Management Meeting #04','Aug 25','KITC Hall','Agenda preparation']],
    documents: [['Installation Report 2026','Event Report','Aug 12'],['Management Meeting #03 Minutes','Meeting Record','Aug 10']],
    attendance: [['Management Meeting #03','Aug 10','10/12'],['Installation Program','Aug 12','11/12']]
  };

  const toast = document.getElementById('toast');
  const notify = text => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(window.__kitcToastTimer);
    window.__kitcToastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const getRoot = () => window.kitcUsbHandle || null;
  const dbDir = async () => {
    const root = getRoot();
    if (!root) throw new Error('KITC USB is not connected.');
    return root.getDirectoryHandle('database', {create:true});
  };

  async function read(name) {
    try {
      const dir = await dbDir();
      const file = await dir.getFileHandle(`${name}.json`);
      return JSON.parse(await (await file.getFile()).text());
    } catch {
      return structuredClone(seeds[name] || []);
    }
  }

  async function write(name, value) {
    const dir = await dbDir();
    const file = await dir.getFileHandle(`${name}.json`, {create:true});
    const writable = await file.createWritable();
    try {
      await writable.write(JSON.stringify(value, null, 2));
    } finally {
      await writable.close();
    }
  }

  async function saveAll() {
    if (!getRoot()) {
      notify('Connect the KITC USB first');
      return false;
    }
    try {
      await Promise.all(DB_FILES.map(name => write(name, window.kitcData[name])));
      notify('Saved to KITC USB ✓');
      return true;
    } catch (error) {
      console.error('KITC USB save failed', error);
      notify(`USB save failed: ${error.message || 'Permission denied'}`);
      return false;
    }
  }

  async function loadAll(handle) {
    window.kitcUsbHandle = handle;
    try {
      for (const name of DB_FILES) window.kitcData[name] = await read(name);
      await saveAll();
      if (typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard');
      notify('KITC data loaded from USB ✓');
    } catch (error) {
      console.error('KITC USB load failed', error);
      notify(`USB load failed: ${error.message || 'Unable to read USB'}`);
    }
  }

  function getFormType(form) {
    const source = form.getAttribute('onsubmit') || '';
    const match = source.match(/submitAdd\(event,'([^']+)'\)/);
    return match ? match[1] : null;
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form || form.id === 'kitcLoginForm' || !form.closest('#modal')) return;
    const type = getFormType(form);
    if (!type) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const values = [...new FormData(form).values()];
    if (type === 'member') window.kitcData.members.push({name:values[0],role:values[1],class:values[2],status:'Active'});
    if (type === 'task') window.kitcData.tasks.push([values[0],values[1],'Medium',values[2],'Pending']);
    if (type === 'event') window.kitcData.events.push([values[0],values[1],values[2],'Planned']);
    if (type === 'meeting') window.kitcData.meetings.push([values[0],values[1],values[2],'Agenda pending']);
    if (type === 'issue') window.kitcData.issues.push([values[0],values[1],values[2],'Pending']);

    const ok = await saveAll();
    if (ok) {
      document.getElementById('modal')?.remove();
      if (typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard');
    }
  }, true);

  document.addEventListener('click', async event => {
    const button = event.target.closest('.action-pill');
    if (!button) return;
    const source = button.getAttribute('onclick') || '';
    const match = source.match(/cycleTask\((\d+)\)/);
    if (!match) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const i = Number(match[1]);
    const states = ['Pending','In Progress','Completed'];
    const current = window.kitcData.tasks[i]?.[4];
    const next = states[(states.indexOf(current) + 1) % states.length];
    if (!window.kitcData.tasks[i]) return;
    window.kitcData.tasks[i][4] = next;
    const ok = await saveAll();
    if (ok && typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard');
  }, true);

  window.addEventListener('kitc:usb-ready', event => loadAll(event.detail.handle));
  if (window.kitcUsbHandle) loadAll(window.kitcUsbHandle);
})();
