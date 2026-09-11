// Bootstrap shared KITC state before the application modules run.
// Storage is optional; the workspace can open with an empty state and load records when available.
(() => {
  'use strict';

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
})();
