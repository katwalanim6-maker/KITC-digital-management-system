(() => {
  'use strict';

  const store = window.kitcData;
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const notify = text => window.__kitcNotify ? window.__kitcNotify(text) : (() => { const t=document.getElementById('toast'); if(!t)return; t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); })();

  async function getDir(root, path, create=true) {
    let dir = root;
    for (const part of path.split('/').filter(Boolean)) dir = await dir.getDirectoryHandle(part, {create});
    return dir;
  }

  async function readDocumentMetadata(root) {
    try {
      const db = await root.getDirectoryHandle('database', {create:true});
      const fh = await db.getFileHandle('documents.json');
      const raw = JSON.parse(await (await fh.getFile()).text());
      const records = Array.isArray(raw) ? raw : Array.isArray(raw.records) ? raw.records : Array.isArray(raw.documents) ? raw.documents : [];
      if (Array.isArray(store.documents)) {
        const byId = new Map(store.documents.map(r => [r.id, r]));
        records.forEach(r => {
          if (!r || typeof r !== 'object') return;
          const id = r.id || uid();
          const existing = byId.get(id) || {id, values:[r.document || r.name || '', r.category || '', r.date || '']};
          if (r.fileName) existing.fileName = r.fileName;
          if (r.filePath) existing.filePath = r.filePath;
          if (r.mimeType) existing.mimeType = r.mimeType;
          if (r.kind) existing.kind = r.kind;
          byId.set(id, existing);
        });
        store.documents = [...byId.values()];
      }
    } catch (e) {
      if (e.name !== 'NotFoundError') console.warn('Document metadata load:', e);
    }
  }

  async function uniqueFileName(dir, requested) {
    const dot = requested.lastIndexOf('.');
    const base = dot > 0 ? requested.slice(0, dot) : requested;
    const ext = dot > 0 ? requested.slice(dot) : '';
    let name = requested, n = 1;
    while (true) {
      try { await dir.getFileHandle(name); name = `${base} (${n++})${ext}`; }
      catch (e) { if (e.name === 'NotFoundError') return name; throw e; }
    }
  }

  async function saveDocumentRecord(record) {
    const root = window.kitcUsbHandle;
    if (!root) throw Error('KITC USB is not connected');
    store.documents.push(record);
    if (window.kitcSaveKeys) await window.kitcSaveKeys(['documents']);
    else if (window.kitcSaveAll) await window.kitcSaveAll();
  }

  async function addDocument(event) {
    event.preventDefault();
    const form = event.target;
    const file = form.file.files[0];
    if (!file) return notify('Choose a photo or file first.');
    const root = window.kitcUsbHandle;
    if (!root) return notify('Connect the KITC USB first.');
    try {
      const isImage = file.type.startsWith('image/');
      const folder = isImage ? 'documents/photos' : 'documents/files';
      const dir = await getDir(root, folder, true);
      const safe = file.name.replace(/[\\/:*?\"<>|]/g, '_');
      const fileName = await uniqueFileName(dir, safe);
      const fh = await dir.getFileHandle(fileName, {create:true});
      const writable = await fh.createWritable();
      await writable.write(file);
      await writable.close();

      const displayName = form.title.value.trim() || fileName;
      const category = form.category.value.trim() || (isImage ? 'Photo' : 'Document');
      const record = {
        id: uid(),
        values: [displayName, category, new Date().toLocaleDateString()],
        fileName,
        filePath: `${folder}/${fileName}`,
        mimeType: file.type || 'application/octet-stream',
        kind: isImage ? 'photo' : 'file'
      };
      await saveDocumentRecord(record);
      closeModal();
      if (typeof window.render === 'function') window.render('documents');
      notify(`${isImage ? 'Photo' : 'File'} saved to USB ✓`);
    } catch (e) {
      console.error('Document save failed', e);
      notify(`Document save failed: ${e.message}`);
    }
  }

  function closeModal() { document.getElementById('modal')?.remove(); }

  window.kitcOpenDocumentAdd = () => {
    document.getElementById('modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" id="modal">
        <div class="modal">
          <button class="modal-close" onclick="document.getElementById('modal')?.remove()">×</button>
          <div class="eyebrow">KITC • USB DOCUMENTS</div>
          <h2>Add photo / document</h2>
          <form id="kitcDocumentForm">
            <label>Display name<input name="title" placeholder="Photo1"></label>
            <label>Category<input name="category" placeholder="Photo / Event / Meeting / Report"></label>
            <label>Photo or file<input name="file" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" required></label>
            <p style="font-size:12px;color:#687385">Images are stored in <strong>documents/photos</strong>. Other files go to <strong>documents/files</strong>.</p>
            <button class="button primary" type="submit">Save to USB</button>
          </form>
        </div>
      </div>`);
    document.getElementById('kitcDocumentForm').onsubmit = addDocument;
  };

  async function openStoredFile(id) {
    const record = store.documents.find(r => r.id === id);
    if (!record?.filePath || !window.kitcUsbHandle) return notify('This document has no USB file attached.');
    try {
      const parts = record.filePath.split('/');
      const fileName = parts.pop();
      const dir = await getDir(window.kitcUsbHandle, parts.join('/'), false);
      const fh = await dir.getFileHandle(fileName);
      const file = await fh.getFile();
      const url = URL.createObjectURL(file);
      const opened = window.open(url, '_blank');
      if (!opened) {
        const a = document.createElement('a'); a.href=url; a.download=fileName; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { notify(`Could not open file: ${e.message}`); }
  }
  window.openStoredDocument = openStoredFile;

  function enhanceDocuments() {
    if (window.kitcCurrentSection !== 'documents' && !document.querySelector('.table-card')) return;
    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach(row => {
      const checkbox = row.querySelector('.record-check');
      if (!checkbox) return;
      const id = checkbox.dataset.id;
      const r = store.documents.find(x => x.id === id);
      if (!r?.filePath) return;
      const first = row.querySelector('td:nth-child(2)');
      if (!first) return;
      const v = (r.values || [r.fileName])[0] || r.fileName;
      first.innerHTML = `<button class="text-button document-file-link" type="button" title="Open ${esc(r.fileName || v)}">${esc(v)}</button>${r.kind === 'photo' ? ' 🖼️' : ' 📄'}`;
      first.querySelector('button').onclick = () => openStoredFile(id);
    });
  }

  const originalRender = window.render;
  if (originalRender) {
    window.render = function(section='dashboard') {
      window.kitcCurrentSection = section;
      const result = originalRender(section);
      if (section === 'documents') setTimeout(enhanceDocuments, 0);
      return result;
    };
  }

  window.addEventListener('kitc:usb-ready', async e => {
    if (e.detail?.handle) {
      await readDocumentMetadata(e.detail.handle);
      window.kitcCurrentSection = window.kitcCurrentSection || 'dashboard';
    }
  });

  // Replace the generic document add button with the real file picker.
  const originalOpenAdd = window.openAdd;
  window.openAdd = function(type='member', id=null) {
    if (type === 'document' && !id) return window.kitcOpenDocumentAdd();
    return originalOpenAdd ? originalOpenAdd(type, id) : notify('Document editor is unavailable.');
  };
})();