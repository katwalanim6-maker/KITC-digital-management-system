(() => {
  const LEGACY_PASSWORD_KEY = 'kitc-password-verifier-v1';
  const MANIFEST = 'KITC-MANIFEST.json';
  const gate = document.getElementById('kitcGate');
  const app = document.querySelector('.app-shell');
  const status = document.getElementById('kitcGateStatus');
  const password = document.getElementById('kitcPassword');
  const connectButton = document.getElementById('connectKitcUsb');
  const unlockButton = document.getElementById('unlockKitc');
  const setupHint = document.getElementById('kitcSetupHint');
  let usbHandle = null;
  let manifest = null;

  const hash = async value => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const setStatus = (text, good = false) => { status.textContent = text; status.dataset.good = good ? 'true' : 'false'; };
  const folderPaths = ['database','documents','documents/meetings','documents/events','documents/reports','documents/certificates','documents/notices','assets','backups'];

  async function readManifest(handle) {
    try { const file = await handle.getFileHandle(MANIFEST); return JSON.parse(await (await file.getFile()).text()); }
    catch { return null; }
  }
  async function writeManifest(handle, value) {
    const file = await handle.getFileHandle(MANIFEST, {create:true});
    const writable = await file.createWritable();
    try { await writable.write(JSON.stringify(value, null, 2)); } finally { await writable.close(); }
  }
  async function ensureStructure(handle) {
    for (const path of folderPaths) { let current = handle; for (const part of path.split('/')) current = await current.getDirectoryHandle(part, {create:true}); }
  }

  const showApp = () => {
    // Explicitly remove the hidden attribute. This avoids the app remaining
    // invisible on browsers that cache the previous hidden state.
    gate.setAttribute('hidden', '');
    app.removeAttribute('hidden');
    app.style.display = 'flex';
    window.kitcUsbHandle = usbHandle;
    window.dispatchEvent(new CustomEvent('kitc:usb-ready', {detail:{handle:usbHandle}}));
    // Let the data engine finish its USB load, then render the dashboard again.
    setTimeout(() => {
      try { if (typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard'); }
      catch (error) { console.error('KITC render after unlock failed', error); setStatus(`KITC UI error: ${error.message || 'Unable to render the dashboard.'}`); }
    }, 0);
  };

  const connectUsb = async () => {
    if (!window.showDirectoryPicker) { setStatus('USB folder access is not supported in this browser. Use a Chromium-based browser with folder access.'); return; }
    try {
      setStatus('Choose your KITC-SECRETARY folder on the USB…');
      const handle = await window.showDirectoryPicker({mode:'readwrite'});
      const permission = await handle.requestPermission({mode:'readwrite'});
      if (permission !== 'granted') throw new Error('USB write permission was not granted.');
      const existing = await readManifest(handle);
      if (existing && existing.system !== 'KITC Digital Management System') throw new Error('This folder is not a KITC Secretary USB.');
      usbHandle = handle;
      manifest = existing || {system:'KITC Digital Management System',format:2,usbId:crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,created:new Date().toISOString(),folders:folderPaths};
      await ensureStructure(handle);
      if (!existing) await writeManifest(handle, manifest);
      connectButton.textContent = '✓ USB Connected';
      connectButton.dataset.connected = 'true';
      setStatus(manifest.passwordVerifier ? 'KITC USB verified. Enter the Secretary password.' : 'New KITC USB detected. Enter a password to protect it.', true);
    } catch (error) {
      if (error?.name === 'AbortError') return setStatus('USB selection cancelled.');
      console.error(error); usbHandle = null; manifest = null; setStatus(`USB error: ${error.message || 'Unable to access the selected folder.'}`);
    }
  };

  const unlock = async () => {
    try {
      const value = password.value;
      if (!value) return setStatus('Enter your Secretary password.');
      if (!usbHandle || !manifest) return setStatus('Connect the KITC USB first.');
      const verifier = await hash(value);
      if (!manifest.passwordVerifier) {
        const legacy = localStorage.getItem(LEGACY_PASSWORD_KEY);
        if (legacy && legacy !== verifier) { setStatus('Incorrect password.'); password.value = ''; return; }
        manifest.passwordVerifier = verifier; manifest.passwordUpdated = new Date().toISOString();
        await writeManifest(usbHandle, manifest); localStorage.removeItem(LEGACY_PASSWORD_KEY);
        setupHint.textContent = 'Password is now stored with the KITC USB. Keep the USB secure.';
        setStatus('Password saved to KITC USB. KITC unlocked.', true); showApp(); return;
      }
      if (verifier !== manifest.passwordVerifier) { setStatus('Incorrect password.'); password.value = ''; return; }
      setStatus('KITC unlocked.', true); showApp();
    } catch (error) { console.error('KITC unlock failed', error); setStatus(`Unlock failed: ${error.message || 'Unknown error'}`); }
  };

  connectButton.addEventListener('click', connectUsb);
  unlockButton.addEventListener('click', unlock);
  password.addEventListener('keydown', event => { if (event.key === 'Enter') unlock(); });
  app.setAttribute('hidden', '');
  gate.removeAttribute('hidden');
  setupHint.textContent = 'Connect the KITC USB first. Your password will be protected by the USB manifest.';
})();
