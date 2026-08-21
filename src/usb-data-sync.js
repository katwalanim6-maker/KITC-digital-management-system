(() => {
  const files = {
    members: 'members.json',
    meetings: 'meetings.json',
    tasks: 'tasks.json',
    events: 'events.json',
    attendance: 'attendance.json',
    issues: 'issues.json',
    documents: 'documents.json'
  };

  const readCollection = async (root, file, key) => {
    const database = await root.getDirectoryHandle('database');
    const handle = await database.getFileHandle(file);
    const parsed = JSON.parse(await (await handle.getFile()).text());
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed[key])) return parsed[key];
    if (parsed && Array.isArray(parsed.records)) return parsed.records;
    throw new Error(`${file} has an unsupported data format`);
  };

  window.addEventListener('kitc:usb-ready', async event => {
    const root = event.detail?.handle;
    if (!root || !window.kitcData) return;
    try {
      const loaded = {};
      for (const [key, file] of Object.entries(files)) {
        try {
          loaded[key] = await readCollection(root, file, key);
        } catch (error) {
          if (error?.name === 'NotFoundError') continue;
          console.warn(`KITC sync skipped ${file}:`, error);
        }
      }
      Object.assign(window.kitcData, loaded);
      if (typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard');
      const count = Array.isArray(window.kitcData.members) ? window.kitcData.members.length : 0;
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = `USB records loaded • ${count} members`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
      }
    } catch (error) {
      console.error('KITC USB data sync failed:', error);
    }
  });
})();
