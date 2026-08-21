(() => {
  const PASSWORD_KEY = 'kitc-password-verifier-v1';
  const APP_KEY = 'kitc-access-granted';
  const REQUIRED_FOLDER = 'KITC-SECRETARY';
  const MANIFEST = 'KITC-MANIFEST.json';

  const gate = document.getElementById('kitcGate');
  const app = document.querySelector('.app-shell');
  const status = document.getElementById('kitcGateStatus');
  const password = document.getElementById('kitcPassword');
  const connectButton = document.getElementById('connectKitcUsb');
  const unlockButton = document.getElementById('unlockKitc');
  const setupHint = document.getElementById('kitcSetupHint');

  let usbHandle = null;
  let firstRun = !localStorage.getItem(PASSWORD_KEY);

  const hash = async value => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const setStatus = (text, good = false) => {
    status.textContent = text;
    status.dataset.good = good ? 'true' : 'false';
  };

  const showApp = () => {
    gate.hidden = true;
    app.hidden = false;
    localStorage.setItem(APP_KEY, '1');
    window.kitcUsbHandle = usbHandle;
    window.dispatchEvent(new CustomEvent('kitc:usb-ready', { detail: { handle: usbHandle } }));
  };

  const ensureKitcFolder = async handle => {
    // The selected directory itself becomes the KITC-SECRETARY root.
    await handle.getFileHandle(MANIFEST, { create: true });
    const manifestHandle = await handle.getFileHandle(MANIFEST, { create: true });
    const writable = await manifestHandle.createWritable();
    await writable.write(JSON.stringify({
      system: 'KITC Digital Management System',
      format: 1,
      created: new Date().toISOString(),
      folders: ['database', 'documents', 'documents/meetings', 'documents/events', 'documents/reports', 'documents/certificates', 'documents/notices', 'assets', 'backups']
    }, null, 2));
    await writable.close();

    for (const path of ['database', 'documents', 'documents/meetings', 'documents/events', 'documents/reports', 'documents/certificates', 'documents/notices', 'assets', 'backups']) {
      const parts = path.split('/');
      let current = handle;
      for (const part of parts) current = await current.getDirectoryHandle(part, { create: true });
    }
  };

  const connectUsb = async () => {
    if (!window.showDirectoryPicker) {
      setStatus('USB folder access is not supported in this browser. Open the site in a browser that supports folder access.');
      return;
    }
    try {
      setStatus('Choose the KITC-SECRETARY folder on your USB…');
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await handle.requestPermission({ mode: 'readwrite' });
      usbHandle = handle;
      await ensureKitcFolder(handle);
      setStatus('KITC USB connected and verified.', true);
      connectButton.textContent = '✓ USB Connected';
      connectButton.dataset.connected = 'true';
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('USB selection cancelled.');
        return;
      }
      console.error(error);
      setStatus(`USB error: ${error.message || 'Unable to access the selected folder.'}`);
    }
  };

  const unlock = async () => {
    const value = password.value;
    if (!value) return setStatus('Enter your Secretary password.');
    if (!usbHandle) return setStatus('Connect the KITC USB first.');

    const verifier = await hash(value);
    if (firstRun) {
      localStorage.setItem(PASSWORD_KEY, verifier);
      firstRun = false;
      setupHint.textContent = 'Password created for this browser. Your USB remains required to open KITC.';
      setStatus('Password created. KITC unlocked.', true);
      showApp();
      return;
    }

    if (verifier !== localStorage.getItem(PASSWORD_KEY)) {
      setStatus('Incorrect password.');
      password.value = '';
      return;
    }

    setStatus('KITC unlocked.', true);
    showApp();
  };

  connectButton.addEventListener('click', connectUsb);
  unlockButton.addEventListener('click', unlock);
  password.addEventListener('keydown', event => {
    if (event.key === 'Enter') unlock();
  });

  app.hidden = true;
  gate.hidden = false;
  setupHint.textContent = firstRun
    ? 'First use: connect your KITC USB, then choose a Secretary password for this browser.'
    : 'Connect the registered KITC USB and enter your Secretary password.';
})();
