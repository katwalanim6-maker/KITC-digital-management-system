/*
 * KITC USB compatibility layer.
 *
 * The application data engine lives in src/main.js. Earlier versions had a
 * second storage engine here, which raced the main engine during the
 * kitc:usb-ready event and caused:
 *   "Cannot set properties of undefined (setting 'members')"
 *
 * Keep this file intentionally passive so old deployments that still load it
 * do not create a second data model or intercept form submissions.
 */
(() => {
  window.kitcUsbStorageVersion = '4.0';
})();
