// Bootstrap the shared KITC state before any storage/bridge script runs.
// The USB remains the source of truth. These defaults only protect the in-memory state.
(() => {
  const defaults = {
    members: [], meetings: [], tasks: [], events: [], attendance: [], issues: [], documents: [],
    followups: [], decisions: [], journal: [], letters: [], timeline: [], meeting_templates: []
  };
  const state = window.kitcData && typeof window.kitcData === 'object' ? window.kitcData : {};
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!Array.isArray(state[key])) state[key] = fallback;
  }
  window.kitcData = state;
  window.KITC_BOOTSTRAPPED = true;
  window.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('script[data-kitc-secretary-suite]')) return;
    const s = document.createElement('script');
    s.src = 'src/secretary-suite.js?v=2';
    s.defer = true;
    s.dataset.kitcSecretarySuite = 'true';
    document.body.appendChild(s);
  }, { once: true });
})();
