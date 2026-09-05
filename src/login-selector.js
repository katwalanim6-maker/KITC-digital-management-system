(() => {
  'use strict';

  const selector = document.getElementById('kitcRoleSelector');
  const roleButtons = [...document.querySelectorAll('[data-login-role]')];
  const roleNotice = document.getElementById('kitcRoleNotice');
  const adminAction = document.getElementById('kitcAdminAction');

  if (!selector || !roleNotice || !adminAction || !roleButtons.length) return;

  const copy = {
    member: 'Member login is not connected yet. The current repository has no member authentication provider configured.',
    executive: 'Executive login is not connected yet. The current repository has no executive authentication provider configured.',
    admin: 'Admin access continues to the existing KITC Secretary USB + password authentication boundary.'
  };

  let selected = null;

  function choose(role) {
    selected = role;
    roleButtons.forEach(button => button.classList.toggle('selected', button.dataset.loginRole === role));
    roleNotice.textContent = copy[role];
    roleNotice.hidden = false;
    adminAction.hidden = role !== 'admin';
  }

  roleButtons.forEach(button => button.addEventListener('click', () => choose(button.dataset.loginRole)));

  const hashRole = location.hash.replace('#', '').toLowerCase();
  if (['member', 'executive', 'admin'].includes(hashRole)) choose(hashRole);
  window.kitcLoginRole = () => selected;
})();
