(() => {
  // Expose the existing KITC application state to the USB storage layer.
  // These are browser-global references to the current in-memory state only;
  // the persistent source of truth remains the connected KITC USB.
  if (typeof data !== 'undefined') window.kitcData = data;
  if (typeof render === 'function') window.render = render;
  if (typeof current !== 'undefined') {
    Object.defineProperty(window, 'kitcCurrentSection', {
      configurable: true,
      get: () => current
    });
  }
})();
