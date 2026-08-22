(() => {
  'use strict';

  const baseRender = window.render;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const data = () => window.kitcData || {};
  const rows = key => Array.isArray(data()[key]) ? data()[key] : [];
  const vals = (key, row) => key === 'members' ? [row.name, row.role, row.class, row.status] : (Array.isArray(row?.values) ? row.values : []);

  function dashboard() {
    const pending = rows('tasks').filter(r => vals('tasks', r)[4] !== 'Completed');
    const upcoming = rows('events').filter(r => vals('events', r)[3] !== 'Completed').slice(0, 4);
    const meetings = rows('meetings').slice(-4).reverse();
    const followups = rows('followups').filter(r => r.status !== 'Done').slice(0, 4);
    const connected = Boolean(window.kitcUsbHandle);
    const supabase = window.kitcSupabaseStatus?.state || 'offline';

    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === 'dashboard'));
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="page-head kitc-dashboard-head">
        <div>
          <div class="eyebrow">KITC • 2026–27 • SECRETARY DESK</div>
          <h1>Good afternoon, Anim 👋</h1>
          <p>Your private command center. USB is the source of truth; Supabase is the connected cloud layer.</p>
        </div>
        <button class="button primary" type="button" id="kitcQuickAdd">＋ Quick Add</button>
      </div>

      <div class="stats">
        <div class="stat"><div class="stat-top">Members</div><strong>${rows('members').length}</strong><span class="trend">Current management records</span></div>
        <div class="stat"><div class="stat-top">Pending Tasks</div><strong>${pending.length}</strong><span class="trend">Follow-up required</span></div>
        <div class="stat"><div class="stat-top">Upcoming Events</div><strong>${upcoming.length}</strong><span class="trend">Next programs</span></div>
        <div class="stat"><div class="stat-top">Open Issues</div><strong>${rows('issues').filter(r => vals('issues', r)[3] !== 'Resolved').length}</strong><span class="trend">IT / assets</span></div>
      </div>

      <div class="kitc-status-strip">
        <span><i class="kitc-status-dot ${connected ? 'is-connected' : ''}"></i> USB ${connected ? 'connected' : 'not connected'}</span>
        <span><i class="kitc-status-dot ${supabase === 'connected' ? 'is-connected' : ''}"></i> Supabase ${supabase}</span>
        <span>Secretary tools ready</span>
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head"><h2>Today's priorities</h2><span class="muted">${pending.length} open</span></div>
          <div class="list">
            ${pending.slice(0, 5).map(r => { const v = vals('tasks', r); return `<div class="list-row"><div><strong>${esc(v[0] || 'Untitled task')}</strong><small>${esc(v[1] || 'Unassigned')} • due ${esc(v[3] || 'No deadline')}</small></div><span class="pill">${esc(v[4] || 'Pending')}</span></div>`; }).join('') || '<div class="empty-state">No pending tasks. Nice work. ✓</div>'}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Upcoming events</h2><button class="text-button" type="button" id="viewEvents">View all</button></div>
          <div class="list">
            ${upcoming.map(r => { const v = vals('events', r); return `<div class="list-row"><div><strong>${esc(v[0] || 'Event')}</strong><small>${esc(v[1] || '')} • ${esc(v[2] || '')}</small></div><span class="pill dark">${esc(v[3] || 'Planned')}</span></div>`; }).join('') || '<div class="empty-state">No upcoming events.</div>'}
          </div>
        </section>
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head"><h2>Recent meetings</h2><button class="text-button" type="button" id="viewMeetings">View all</button></div>
          <div class="list">
            ${meetings.map(r => { const v = vals('meetings', r); return `<div class="list-row"><div><strong>${esc(v[0] || 'Meeting')}</strong><small>${esc(v[1] || '')} • ${esc(v[2] || '')}</small></div><span class="pill">${esc(v[3] || 'Recorded')}</span></div>`; }).join('') || '<div class="empty-state">No meetings recorded yet.</div>'}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Secretary follow-ups</h2><button class="text-button" type="button" id="viewFollowups">Open tracker</button></div>
          <div class="list">
            ${followups.map(r => `<div class="list-row"><div><strong>${esc(r.values?.[0] || 'Follow-up')}</strong><small>${esc(r.values?.[1] || '')} • ${esc(r.values?.[2] || '')}</small></div><span class="pill">${esc(r.status || 'Pending')}</span></div>`).join('') || '<div class="empty-state">No outstanding follow-ups.</div>'}
          </div>
        </section>
      </div>

      <section class="panel kitc-quick-panel">
        <div class="panel-head"><h2>Secretary workflows</h2><span class="muted">Everything stays organized</span></div>
        <div class="quick-add">
          <button class="button" type="button" data-quick="meeting">＋ Meeting</button>
          <button class="button" type="button" data-quick="task">＋ Task</button>
          <button class="button" type="button" data-quick="event">＋ Event</button>
          <button class="button" type="button" data-quick="issue">＋ IT Issue</button>
          <button class="button" type="button" data-quick="member">＋ Member</button>
          <button class="button" type="button" data-quick="document">＋ Document</button>
        </div>
      </section>`;

    document.getElementById('kitcQuickAdd')?.addEventListener('click', () => window.openAdd?.('member'));
    document.getElementById('viewEvents')?.addEventListener('click', () => window.render('events'));
    document.getElementById('viewMeetings')?.addEventListener('click', () => window.render('meetings'));
    document.getElementById('viewFollowups')?.addEventListener('click', () => window.render('followups'));
    document.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => window.openAdd?.(b.dataset.quick)));
  }

  window.render = section => section === 'dashboard' ? dashboard() : baseRender?.(section);
  window.renderDashboard = dashboard;
  dashboard();
})();
