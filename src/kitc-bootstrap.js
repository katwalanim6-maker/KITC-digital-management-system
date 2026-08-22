// Bootstrap the shared KITC state before any storage/bridge script runs.
// This prevents legacy USB loaders from ever writing into an undefined object.
(() => {
  const defaults = { members: [], meetings: [], tasks: [], events: [], attendance: [], issues: [], documents: [] };
  const state = window.kitcData && typeof window.kitcData === 'object' ? window.kitcData : {};
  for (const [key, fallback] of Object.entries(defaults)) if (!Array.isArray(state[key])) state[key] = fallback;
  window.kitcData = state;
  window.KITC_BOOTSTRAPPED = true;
  window.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('script');
    s.src = 'src/secretary-suite.js?v=1';
    s.defer = true;
    document.body.appendChild(s);
  }, { once: true });
})();
