// Bootstrap shared KITC state before application modules run.
// The workspace opens directly. Browser storage is optional and never acts as a password or access gate.
(() => {
  'use strict';

  const defaults = {
    members: [], meetings: [], tasks: [], events: [], attendance: [], issues: [], documents: [],
    followups: [], decisions: [], journal: [], letters: [], timeline: [], meeting_templates: []
  };
  const storageKey = 'kitc-data-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { saved = {}; }

  const state = window.kitcData && typeof window.kitcData === 'object' ? window.kitcData : {};
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!Array.isArray(state[key])) state[key] = Array.isArray(saved[key]) ? saved[key] : fallback;
  }

  window.kitcData = state;
  window.KITC_STORAGE_KEY = storageKey;
  window.kitcPersist = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(window.kitcData)); return true; }
    catch (error) { console.error('[KITC] Browser storage unavailable', error); return false; }
  };
  window.KITC_BOOTSTRAPPED = true;
})();
