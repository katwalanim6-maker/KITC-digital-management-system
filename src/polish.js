(() => {
  'use strict';

  const closeProfile = () => {
    document.getElementById('kitcProfileMenu')?.remove();
    document.getElementById('profileButton')?.setAttribute('aria-expanded', 'false');
  };

  const openProfile = () => {
    closeProfile();
    const button = document.getElementById('profileButton');
    if (!button) return;
    const menu = document.createElement('div');
    menu.id = 'kitcProfileMenu';
    menu.className = 'kitc-profile-menu';
    const connected = Boolean(window.kitcUsbHandle);
    menu.innerHTML = `
      <div class="kitc-profile-heading"><span class="kitc-profile-avatar">A</span><div><strong>Anim</strong><small>Secretary • 2026–27</small></div></div>
      <div class="kitc-profile-status"><span class="kitc-status-dot ${connected ? 'is-connected' : ''}"></span>${connected ? 'KITC USB connected' : 'KITC USB not connected'}</div>
      <button type="button" class="kitc-profile-close">Close</button>
    `;
    document.body.appendChild(menu);
    const rect = button.getBoundingClientRect();
    menu.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - menu.offsetHeight - 12)}px`;
    menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
    button.setAttribute('aria-expanded', 'true');
    menu.querySelector('.kitc-profile-close').onclick = closeProfile;
  };

  const bind = () => {
    const profile = document.getElementById('profileButton');
    const display = document.getElementById('displayButton');
    const sidebar = document.getElementById('sidebar');
    const menuButton = document.getElementById('menuButton');

    profile?.addEventListener('click', event => {
      event.stopPropagation();
      document.getElementById('kitcProfileMenu') ? closeProfile() : openProfile();
    });

    display?.addEventListener('click', () => {
      const lowGlow = document.body.classList.toggle('kitc-low-glow');
      display.setAttribute('aria-pressed', String(lowGlow));
      display.textContent = lowGlow ? '◑' : '◔';
    });

    menuButton?.addEventListener('click', () => {
      const open = sidebar?.classList.contains('open');
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('#profileButton') && !event.target.closest('#kitcProfileMenu')) closeProfile();
      if (window.innerWidth <= 780 && sidebar?.classList.contains('open') && !event.target.closest('#sidebar') && !event.target.closest('#menuButton')) {
        sidebar.classList.remove('open');
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.setAttribute('aria-label', 'Open menu');
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) {
        sidebar?.classList.remove('open');
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.setAttribute('aria-label', 'Open menu');
      }
      closeProfile();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
