(() => {
  'use strict';

  const selector = document.getElementById('kitcRoleSelector');
  const roleButtons = [...document.querySelectorAll('[data-login-role]')];
  const backButton = document.getElementById('kitcRoleBack');
  const adminForm = document.getElementById('kitcAdminLogin');
  const gateTitle = document.getElementById('kitcGateTitle');
  const gateDescription = document.getElementById('kitcGateDescription');
  const roleNotice = document.getElementById('kitcRoleNotice');

  if (!selector || !adminForm || !gateTitle || !gateDescription || !roleNotice) return;

  const copy = {
    admin: {
      title: 'Admin Login',
      description: 'Connect the KITC Secretary USB and enter the Admin password to open the management system.',
      notice: ''
    },
    member: {
      title: 'Member Login',
      description: 'Member authentication will open the read-only member experience.',
      notice: 'Member login is not connected yet. The current repository has no member authentication provider configured.'
    },
    executive: {
      title: 'Executive Login',
      description: 'Executive authentication will open the executive workspace.',
      notice: 'Executive login is not connected yet. The current repository has no executive authentication provider configured.'
    }
  };

  let selected = null;

  function choose(role) {
    selected = role;
    roleButtons.forEach(button => button.classList.toggle('selected', button.dataset.loginRole === role));
    selector.hidden = true;
    adminForm.hidden = role !== 'admin';
    if (backButton) backButton.hidden = false;
    gateTitle.textContent = copy[role].title;
    gateDescription.textContent = copy[role].description;
    roleNotice.textContent = copy[role].notice;
    roleNotice.hidden = !copy[role].notice;

    if (role !== 'admin') {
      adminForm.querySelectorAll('input,button').forEach(control => {
        control.disabled = true;
      });
    } else {
      adminForm.querySelectorAll('input,button').forEach(control => {
        control.disabled = false;
      });
    }
  }

  function reset() {
    selected = null;
    selector.hidden = false;
    adminForm.hidden = true;
    if (backButton) backButton.hidden = true;
    gateTitle.textContent = 'Unlock KITC';
    gateDescription.textContent = 'Choose how you want to access KITC.';
    roleNotice.hidden = true;
    roleButtons.forEach(button => button.classList.remove('selected'));
  }

  roleButtons.forEach(button => button.addEventListener('click', () => choose(button.dataset.loginRole)));
  backButton?.addEventListener('click', reset);

  window.kitcLoginRole = () => selected;
})();
