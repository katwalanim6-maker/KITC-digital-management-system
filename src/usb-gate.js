(() => {
  'use strict';

  const LEGACY_PASSWORD_KEY = 'kitc-password-verifier-v1';
  const MANIFEST = 'KITC-MANIFEST.json';
  const gate = document.getElementById('kitcGate');
  const app = document.getElementById('kitcApp') || document.querySelector('.app-shell');
  const status = document.getElementById('kitcGateStatus');
  const password = document.getElementById('kitcPassword');
  const connectButton = document.getElementById('connectKitcUsb');
  const unlockButton = document.getElementById('unlockKitc');
  const setupHint = document.getElementById('kitcSetupHint');
  let usbHandle = null;
  let manifest = null;

  if (!gate || !app || !status || !password || !connectButton || !unlockButton || !setupHint) {
    console.error('KITC unlock boundary is incomplete. Required gate elements are missing.');
    return;
  }

  const hash = async value => {
    if (!window.crypto?.subtle) throw new Error('Secure browser cryptography is unavailable. Open KITC from HTTPS.');
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const setStatus = (text, good = false) => {
    status.textContent = text;
    status.dataset.good = good ? 'true' : 'false';
  };

  const folderPaths = [
    'database', 'documents', 'documents/meetings', 'documents/events',
    'documents/reports', 'documents/certificates', 'documents/notices',
    'assets', 'backups'
  ];

  async function readManifest(handle) {
    try {
      const file = await handle.getFileHandle(MANIFEST);
      return JSON.parse(await (await file.getFile()).text());
    } catch { return null; }
  }

  async function writeManifest(handle, value) {
    const file = await handle.getFileHandle(MANIFEST, { create: true });
    const writable = await file.createWritable();
    try { await writable.write(JSON.stringify(value, null, 2)); } finally { await writable.close(); }
  }

  async function ensureStructure(handle) {
    for (const path of folderPaths) {
      let current = handle;
      for (const part of path.split('/')) current = await current.getDirectoryHandle(part, { create: true });
    }
  }

  const showApp = () => {
    gate.setAttribute('hidden', '');
    app.removeAttribute('hidden');
    window.kitcUsbHandle = usbHandle;
    window.dispatchEvent(new CustomEvent('kitc:unlocked', { detail: { handle: usbHandle } }));
    window.dispatchEvent(new CustomEvent('kitc:usb-ready', { detail: { handle: usbHandle } }));
    setTimeout(() => {
      try { if (typeof window.render === 'function') window.render(window.kitcCurrentSection || 'dashboard'); }
      catch (error) { console.error('KITC render after unlock failed', error); setStatus(`KITC UI error: ${error.message || 'Unable to render the dashboard.'}`); }
    }, 0);
  };

  const setConnectedState = connected => {
    unlockButton.disabled = !connected;
    connectButton.textContent = connected ? '✓ USB Connected' : '↯ Connect KITC USB';
    connectButton.dataset.connected = connected ? 'true' : 'false';
  };

  const connectUsb = async () => {
    if (!window.showDirectoryPicker) {
      setStatus('USB folder access is not supported in this browser. Use a Chromium-based browser with folder access.');
      return;
    }
    connectButton.disabled = true;
    try {
      setStatus('Choose your KITC-SECRETARY folder on the USB…');
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') throw new Error('USB write permission was not granted.');
      const existing = await readManifest(handle);
      if (existing && existing.system !== 'KITC Digital Management System') throw new Error('This folder is not a KITC Secretary USB.');
      usbHandle = handle;
      manifest = existing || {
        system: 'KITC Digital Management System', format: 2,
        usbId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created: new Date().toISOString(), folders: folderPaths
      };
      await ensureStructure(handle);
      if (!existing) await writeManifest(handle, manifest);
      setConnectedState(true);
      setStatus(manifest.passwordVerifier ? 'KITC USB verified. Enter the Admin password.' : 'New KITC USB detected. Create the Admin password to protect it.', true);
      setupHint.textContent = manifest.passwordVerifier ? 'USB is ready. Your password is checked against its protected manifest.' : 'This is a new KITC USB. The first password you enter becomes its Admin password.';
      password.focus();
    } catch (error) {
      setConnectedState(false);
      if (error?.name === 'AbortError') setStatus('USB selection cancelled.');
      else { console.error(error); usbHandle = null; manifest = null; setStatus(`USB error: ${error.message || 'Unable to access the selected folder.'}`); }
    } finally { connectButton.disabled = false; }
  };

  const unlock = async () => {
    unlockButton.disabled = true;
    try {
      const value = password.value;
      if (!value) { setStatus('Enter your Admin password.'); return; }
      if (!usbHandle || !manifest) { setStatus('Connect the KITC USB first.'); return; }
      const verifier = await hash(value);
      if (!manifest.passwordVerifier) {
        const legacy = localStorage.getItem(LEGACY_PASSWORD_KEY);
        if (legacy && legacy !== verifier) { setStatus('Incorrect password.'); password.value = ''; return; }
        manifest.passwordVerifier = verifier;
        manifest.passwordUpdated = new Date().toISOString();
        await writeManifest(usbHandle, manifest);
        localStorage.removeItem(LEGACY_PASSWORD_KEY);
        setupHint.textContent = 'Admin password saved to the KITC USB. Keep the USB secure.';
        setStatus('Password saved. Admin workspace unlocked.', true);
        showApp(); return;
      }
      if (verifier !== manifest.passwordVerifier) { setStatus('Incorrect password.'); password.value = ''; return; }
      setStatus('Admin workspace unlocked.', true);
      showApp();
    } catch (error) {
      console.error('KITC unlock failed', error);
      setStatus(`Unlock failed: ${error.message || 'Unknown error'}`);
    } finally { unlockButton.disabled = !usbHandle || !manifest; }
  };

  connectButton.addEventListener('click', connectUsb);
  unlockButton.addEventListener('click', unlock);
  password.addEventListener('keydown', event => { if (event.key === 'Enter' && !unlockButton.disabled) unlock(); });
  gate.removeAttribute('hidden');
  app.setAttribute('hidden', '');
  setConnectedState(false);
  setupHint.textContent = 'Step 1: connect the KITC USB. Step 2: enter the Admin password.';
})();
