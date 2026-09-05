(() => {
  'use strict';

  const selector = document.getElementById('kitcRoleSelector');
  const roleButtons = [...document.querySelectorAll('[data-login-role]')];
  const roleNotice = document.getElementById('kitcRoleNotice');
  const adminAction = document.getElementById('kitcAdminAction');

  if (selector || roleNotice || adminAction || roleButtons.length) {
    if (!selector || !roleNotice || !adminAction || !roleButtons.length) return;
    const copy = {
      member: 'Member access uses the KITC Supabase authentication workspace.',
      executive: 'Executive authentication is not connected yet.',
      admin: 'Admin access continues to the existing KITC Secretary authentication boundary.'
    };
    let selected = null;
    function choose(role) {
      selected = role;
      roleButtons.forEach(button => button.classList.toggle('selected', button.dataset.loginRole === role));
      roleNotice.textContent = copy[role];
      roleNotice.hidden = false;
      adminAction.hidden = role !== 'admin';
      if (role === 'member') window.location.href = 'member.html';
    }
    roleButtons.forEach(button => button.addEventListener('click', () => choose(button.dataset.loginRole)));
    const hashRole = location.hash.replace('#', '').toLowerCase();
    if (['member', 'executive', 'admin'].includes(hashRole)) choose(hashRole);
    window.kitcLoginRole = () => selected;
  }
})();
