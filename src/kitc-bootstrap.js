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

  // The Secretary suite is part of the unlocked application, not the lock screen.
  // Loading it only after the gate succeeds keeps the security boundary independent
  // from dashboard rendering and prevents frontend modules from competing with the gate.
  const loadSecretarySuite = () => {
    if (document.querySelector('script[data-kitc-secretary-suite]')) return;
    const s = document.createElement('script');
    s.src = 'src/secretary-suite.js?v=3';
    s.dataset.kitcSecretarySuite = 'true';
    s.onload = () => window.dispatchEvent(new Event('kitc:secretary-suite-ready'));
    s.onerror = () => console.error('KITC Secretary suite failed to load.');
    document.body.appendChild(s);
  };

  window.addEventListener('kitc:unlocked', loadSecretarySuite, { once: true });
})();
