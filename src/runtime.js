(() => {
  'use strict';

  const BUILD = '20260822-runtime-v1';
  const content = document.getElementById('content');
  const app = document.getElementById('kitcApp');
  const toast = document.getElementById('toast');
  let lastError = null;

  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__kitcRuntimeToast);
    window.__kitcRuntimeToast = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const showRuntimeError = error => {
    lastError = error;
    if (!content) return;
    const message = error?.message || String(error || 'Unknown KITC runtime error');
    content.innerHTML = `
      <div class="kitc-runtime-error">
        <div class="eyebrow">KITC • RECOVERY</div>
        <h1>KITC is recovering</h1>
        <p>The management shell loaded, but one application module did not finish initializing.</p>
        <div class="kitc-runtime-error-detail">${String(message).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))}</div>
        <button class="button primary" type="button" id="kitcRetryRender">Retry dashboard</button>
      </div>`;
    document.getElementById('kitcRetryRender')?.addEventListener('click', () => ensureRendered(true));
  };

  const ensureRendered = (force = false) => {
    if (!content || !app || app.hasAttribute('hidden')) return false;
    try {
      const current = window.KITC_SUITE_SECTION || window.kitcCurrentSection || 'dashboard';
      if (force || content.dataset.kitcRendered !== 'true' || content.querySelector('[data-kitc-loading]')) {
        if (typeof window.render !== 'function') throw new Error('KITC render engine is unavailable.');
        window.render(current);
        content.dataset.kitcRendered = 'true';
      }
      if (!content.textContent.trim() && !content.children.length) throw new Error('KITC render engine returned an empty page.');
      lastError = null;
      return true;
    } catch (error) {
      console.error('[KITC runtime]', error);
      showRuntimeError(error);
      return false;
    }
  };

  window.KITC_RUNTIME = { build: BUILD, ensureRendered, getLastError: () => lastError };

  window.addEventListener('error', event => {
    if (event?.error) console.error('[KITC uncaught]', event.error);
  });
  window.addEventListener('unhandledrejection', event => {
    console.error('[KITC unhandled promise]', event.reason);
    if (app && !app.hasAttribute('hidden') && content && !content.textContent.trim()) showRuntimeError(event.reason);
  });

  window.addEventListener('kitc:unlocked', () => {
    [0, 50, 200, 700, 1500].forEach(delay => setTimeout(() => ensureRendered(delay > 0), delay));
  });

  window.addEventListener('kitc:usb-ready', () => {
    setTimeout(() => ensureRendered(true), 100);
  });

  window.addEventListener('kitc:secretary-suite-ready', () => {
    setTimeout(() => ensureRendered(true), 0);
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (app && !app.hasAttribute('hidden')) ensureRendered();
  }, { once: true });
})();
