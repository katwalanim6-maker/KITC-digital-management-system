import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, AlertCircle, Archive, ArrowUpRight, BarChart3, Bell, CalendarDays,
  CheckCircle2, ChevronRight, ClipboardList, Clock3, FileText, FolderOpen,
  Gauge, HardDrive, Home, LayoutDashboard, Menu, Plus, Search, Settings,
  ShieldCheck, Users, Wrench, X, Zap, LogOut
} from 'lucide-react'
import './styles.css'

const initialMembers = [
  { id: 1, name: 'Anim Katwal', role: 'Secretary', className: '12', section: 'A', status: 'Active', attendance: 92 },
  { id: 2, name: 'Prashna Rai', role: 'President', className: '12', section: 'B', status: 'Active', attendance: 96 },
  { id: 3, name: 'Sujal Sharma', role: 'Vice-President', className: '11', section: 'A', status: 'Active', attendance: 88 },
  { id: 4, name: 'Aayush Karki', role: 'IT Coordinator', className: '11', section: 'C', status: 'Active', attendance: 90 },
  { id: 5, name: 'Pratiksha Rai', role: 'Member', className: '10', section: 'A', status: 'Active', attendance: 84 },
  { id: 6, name: 'Rojina Limbu', role: 'Member', className: '10', section: 'B', status: 'Active', attendance: 91 },
]

const initialTasks = [
  { id: 1, title: 'Complete computer lab inspection report', assignee: 'Anim Katwal', priority: 'High', deadline: 'Aug 24, 2026', status: 'In Progress' },
  { id: 2, title: 'Prepare management meeting agenda', assignee: 'Anim Katwal', priority: 'Medium', deadline: 'Aug 25, 2026', status: 'Pending' },
  { id: 3, title: 'Confirm IT workshop venue', assignee: 'Sujal Sharma', priority: 'Medium', deadline: 'Aug 26, 2026', status: 'Completed' },
  { id: 4, title: 'Upload previous event reports', assignee: 'Aayush Karki', priority: 'Low', deadline: 'Aug 28, 2026', status: 'Pending' },
]

const initialEvents = [
  { id: 1, title: 'Management Meeting #04', date: 'Aug 25, 2026', venue: 'KCITC Room', status: 'Upcoming', participants: 12 },
  { id: 2, title: 'KCITC IT Workshop 2026', date: 'Aug 28, 2026', venue: 'Computer Lab', status: 'Upcoming', participants: 48 },
  { id: 3, title: 'New Member Orientation', date: 'Aug 12, 2026', venue: 'Auditorium', status: 'Completed', participants: 36 },
]

const meetings = [
  { id: 1, title: 'Management Meeting #03', date: 'Aug 15, 2026', location: 'KCITC Room', attendees: 11, decisions: 3 },
  { id: 2, title: 'Management Meeting #02', date: 'Aug 02, 2026', location: 'Library', attendees: 10, decisions: 4 },
  { id: 3, title: 'Management Meeting #01', date: 'Jul 18, 2026', location: 'KCITC Room', attendees: 12, decisions: 2 },
]

const assets = [
  { id: 1, name: 'PC-27', type: 'Desktop Computer', location: 'Computer Lab', condition: 'Needs attention', issue: 'Keyboard not working' },
  { id: 2, name: 'PC-12', type: 'Desktop Computer', location: 'Computer Lab', condition: 'Good', issue: '—' },
  { id: 3, name: 'Projector-01', type: 'Projector', location: 'Auditorium', condition: 'Good', issue: '—' },
  { id: 4, name: 'Router-02', type: 'Network Equipment', location: 'Lab Rack', condition: 'Good', issue: '—' },
]

const documents = [
  { title: 'Management Meeting #03 Minutes', category: 'Meeting Records', date: 'Aug 15, 2026' },
  { title: 'New Member Orientation Report', category: 'Event Reports', date: 'Aug 13, 2026' },
  { title: 'Computer Lab Inspection Sheet', category: 'IT Records', date: 'Aug 21, 2026' },
  { title: 'KCITC Annual Notice Template', category: 'Notices', date: 'Aug 01, 2026' },
]

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'events', label: 'Programs & Events', icon: Zap },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'it', label: 'IT / Assets', icon: HardDrive },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'handover', label: 'Handover Center', icon: Archive },
]

const pageTitles = Object.fromEntries(nav.map((item) => [item.id, item.label]))

function App() {
  const [active, setActive] = useState('dashboard')
  const [members, setMembers] = useState(initialMembers)
  const [tasks, setTasks] = useState(initialTasks)
  const [events, setEvents] = useState(initialEvents)
  const [search, setSearch] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')

  const filteredMembers = useMemo(() => members.filter((m) => `${m.name} ${m.role} ${m.className} ${m.section}`.toLowerCase().includes(search.toLowerCase())), [members, search])
  const filteredTasks = useMemo(() => tasks.filter((t) => `${t.title} ${t.assignee} ${t.status}`.toLowerCase().includes(search.toLowerCase())), [tasks, search])
  const filteredEvents = useMemo(() => events.filter((e) => `${e.title} ${e.venue} ${e.status}`.toLowerCase().includes(search.toLowerCase())), [events, search])

  const openAdd = () => {
    if (['members', 'tasks', 'events'].includes(active)) setModal(active)
    else setNotice('Quick add is available for Members, Tasks and Programs right now.')
  }

  const submitModal = (payload) => {
    if (modal === 'members') setMembers((prev) => [...prev, { id: Date.now(), ...payload, attendance: 0, status: 'Active' }])
    if (modal === 'tasks') setTasks((prev) => [...prev, { id: Date.now(), ...payload, status: 'Pending' }])
    if (modal === 'events') setEvents((prev) => [...prev, { id: Date.now(), ...payload, status: 'Upcoming', participants: 0 }])
    setModal(null)
    setNotice(`${modal === 'members' ? 'Member' : modal === 'tasks' ? 'Task' : 'Program'} added to this demo session.`)
  }

  const toggleTask = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t))

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">K</div>
          <div><strong>KCITC</strong><span>Digital Management</span></div>
        </div>
        <div className="term-chip"><span className="dot" /> 2026–27 · Current Term</div>
        <nav>
          <div className="nav-label">WORKSPACE</div>
          {nav.map((item) => {
            const Icon = item.icon
            return <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(item.id); setShowSidebar(false); setSearch('') }}><Icon size={18} /><span>{item.label}</span></button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setNotice('Settings will be connected to role permissions and Supabase in the next phase.')}><Settings size={18} /><span>Settings</span></button>
          <div className="profile-mini"><div className="avatar">AK</div><div><strong>Anim Katwal</strong><span>Secretary</span></div><LogOut size={15} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setShowSidebar(!showSidebar)}><Menu size={21} /></button><div><div className="eyebrow">KCITC DIGITAL MANAGEMENT SYSTEM</div><h1>{pageTitles[active] || 'Dashboard'}</h1></div></div>
          <div className="top-actions"><div className="global-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" /><kbd>⌘ K</kbd></div><button className="icon-btn" onClick={() => setNotice('No new notifications.') }><Bell size={18} /></button><button className="user-pill" onClick={() => setNotice('Signed in as Secretary · Demo mode')}><span className="avatar small">AK</span><span className="hide-mobile">Anim</span></button></div>
        </header>

        <div className="content">
          {notice && <div className="toast"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
          {active === 'dashboard' && <Dashboard onNavigate={setActive} tasks={tasks} events={events} />}
          {active === 'members' && <Members members={filteredMembers} onAdd={openAdd} />}
          {active === 'meetings' && <Meetings />}
          {active === 'tasks' && <Tasks tasks={filteredTasks} onAdd={openAdd} onToggle={toggleTask} />}
          {active === 'events' && <Events events={filteredEvents} onAdd={openAdd} />}
          {active === 'attendance' && <Attendance members={members} />}
          {active === 'it' && <ITAssets />}
          {active === 'documents' && <Documents />}
          {active === 'announcements' && <Announcements />}
          {active === 'reports' && <Reports />}
          {active === 'handover' && <Handover />}
        </div>
      </main>

      <div className="mobile-nav">{nav.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? 'selected' : ''} onClick={() => setActive(item.id)}><Icon size={19} /><span>{item.label.split(' ')[0]}</span></button> })}<button onClick={openAdd}><Plus size={21} /><span>Add</span></button></div>
      <button className="floating-add" onClick={openAdd}><Plus size={22} /></button>
      {modal && <Modal type={modal} onClose={() => setModal(null)} onSubmit={submitModal} />}
    </div>
  )
}

function Dashboard({ onNavigate, tasks, events }) {
  const pending = tasks.filter((t) => t.status !== 'Completed').length
  return <>
    <section className="hero"><div><span className="status-badge"><span className="dot" /> LIVE WORKSPACE</span><h2>Good afternoon, Anim <span>👋</span></h2><p>Secretary · KCITC Management 2026–27</p></div><button className="primary" onClick={() => onNavigate('handover')}><ShieldCheck size={17} /> View handover readiness</button></section>
    <div className="stat-grid"><Stat label="Active Members" value="12" meta="+2 this term" icon={Users} /><Stat label="Pending Tasks" value={pending} meta="Needs attention" icon={ClipboardList} tone="warn" /><Stat label="Upcoming Events" value="2" meta="Next: Aug 25" icon={CalendarDays} /><Stat label="Open Issues" value="1" meta="PC-27 · Medium" icon={AlertCircle} tone="danger" /></div>
    <div className="section-heading"><div><h3>Today's priorities</h3><p>Things that need your attention first.</p></div><button className="link-btn" onClick={() => onNavigate('tasks')}>View all tasks <ArrowUpRight size={15} /></button></div>
    <div className="two-col"><div className="panel priority-panel">{tasks.filter((t) => t.status !== 'Completed').slice(0, 3).map((task) => <div className="priority-row" key={task.id}><div className={`priority-icon ${task.priority.toLowerCase()}`}><ClipboardList size={17} /></div><div className="grow"><strong>{task.title}</strong><span>Due {task.deadline} · {task.assignee}</span></div><span className={`pill ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></div>)}</div><div className="panel"><div className="panel-title"><span>Upcoming</span><CalendarDays size={17} /></div>{events.filter((e) => e.status === 'Upcoming').map((event) => <div className="event-mini" key={event.id}><div className="date-box"><b>{event.date.split(' ')[1]?.replace(',', '')}</b><span>{event.date.split(' ')[0]}</span></div><div><strong>{event.title}</strong><span>{event.venue} · {event.participants || 0} participants</span></div><ChevronRight size={17} /></div>)}</div></div>
    <div className="section-heading"><div><h3>Recent activity</h3><p>A lightweight audit trail for the workspace.</p></div></div>
    <div className="panel activity-list"><ActivityRow text="Anim added a computer lab inspection issue" time="Today · 13:42" icon={Wrench} /><ActivityRow text="Management Meeting #03 minutes uploaded" time="Yesterday · 18:10" icon={FileText} /><ActivityRow text="IT Workshop 2026 was added to programs" time="Aug 20 · 16:22" icon={Zap} /><ActivityRow text="Prashna marked venue confirmation complete" time="Aug 20 · 15:04" icon={CheckCircle2} /></div>
    <div className="demo-banner"><div><strong>Demo workspace</strong><p>This first public build uses sample records in the browser. Shared database, authentication, storage and real role permissions are prepared as the next backend phase.</p></div><button onClick={() => onNavigate('handover')}>See architecture <ChevronRight size={16} /></button></div>
  </>
}

function Stat({ label, value, meta, icon: Icon, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone || ''}`}><Icon size={19} /></div><div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div></div> }
function ActivityRow({ text, time, icon: Icon }) { return <div className="activity-row"><div className="activity-icon"><Icon size={16} /></div><div><strong>{text}</strong><span>{time}</span></div><ChevronRight size={16} /></div> }

function Members({ members, onAdd }) { return <PageFrame title="Members" subtitle="People, roles and club membership records." action="Add member" onAction={onAdd}><div className="panel table-panel"><TableHead cols={['Member', 'Role', 'Class', 'Status', 'Attendance']} />{members.map((m) => <div className="table-row" key={m.id}><div className="member-cell"><div className="avatar">{m.name.split(' ').map((n) => n[0]).join('').slice(0,2)}</div><div><strong>{m.name}</strong><span>Joined this term</span></div></div><div>{m.role}</div><div>{m.className} · {m.section}</div><div><span className="pill active-pill">{m.status}</span></div><div><strong>{m.attendance}%</strong></div></div>)}</div></PageFrame> }
function Meetings() { return <PageFrame title="Meetings" subtitle="Searchable history of agendas, minutes, decisions and attendees." action="New meeting"><div className="card-grid">{meetings.map((m) => <div className="panel meeting-card" key={m.id}><div className="card-top"><span className="soft-icon"><CalendarDays size={18} /></span><span className="pill completed">Archived</span></div><h3>{m.title}</h3><p>{m.date} · {m.location}</p><div className="metric-line"><span>{m.attendees} attendees</span><span>{m.decisions} decisions</span></div><button className="text-button">Open meeting <ChevronRight size={15} /></button></div>)}</div></PageFrame> }
function Tasks({ tasks, onAdd, onToggle }) { return <PageFrame title="Tasks" subtitle="Assignments created from meetings, programs and day-to-day work." action="Add task" onAction={onAdd}><div className="panel table-panel"><TableHead cols={['Task', 'Assigned to', 'Priority', 'Deadline', 'Status']} />{tasks.map((t) => <div className="table-row" key={t.id}><div><strong>{t.title}</strong><span>Created from Secretary workspace</span></div><div>{t.assignee}</div><div><span className={`priority-text ${t.priority.toLowerCase()}`}>{t.priority}</span></div><div>{t.deadline}</div><div><button className={`pill button-pill ${t.status.toLowerCase().replace(' ', '-')}`} onClick={() => onToggle(t.id)}>{t.status}</button></div></div>)}</div></PageFrame> }
function Events({ events, onAdd }) { return <PageFrame title="Programs & Events" subtitle="Permanent records for planning, attendance, reports and lessons learned." action="Create program" onAction={onAdd}><div className="card-grid">{events.map((e) => <div className="panel event-card" key={e.id}><div className="event-cover"><Zap size={25} /><span className={`pill ${e.status.toLowerCase()}`}>{e.status}</span></div><div className="event-body"><h3>{e.title}</h3><p>{e.date} · {e.venue}</p><div className="metric-line"><span>{e.participants} participants</span><span>Planning record</span></div><div className="progress"><span style={{ width: e.status === 'Completed' ? '100%' : '46%' }} /></div><button className="text-button">Open event record <ChevronRight size={15} /></button></div></div>)}</div></PageFrame> }
function Attendance({ members }) { return <PageFrame title="Attendance" subtitle="Member participation across meetings and programs."><div className="attendance-overview"><div className="panel big-number"><span>Average attendance</span><strong>90%</strong><p>Across the current management sample.</p></div><div className="panel"><div className="panel-title"><span>Member attendance</span><CheckCircle2 size={17} /></div>{members.slice(0,5).map((m) => <div className="bar-row" key={m.id}><div><span>{m.name}</span><strong>{m.attendance}%</strong></div><div className="progress"><span style={{ width: `${m.attendance}%` }} /></div></div>)}</div></div></PageFrame> }
function ITAssets() { return <PageFrame title="IT / Assets" subtitle="Equipment inventory, condition and issue history." action="Report issue"><div className="stat-grid compact"><Stat label="Tracked assets" value="50" meta="Computer lab + equipment" icon={HardDrive} /><Stat label="Open issues" value="1" meta="PC-27" icon={AlertCircle} tone="danger" /><Stat label="Good condition" value="96%" meta="Current inspection" icon={CheckCircle2} /></div><div className="panel table-panel"><TableHead cols={['Asset', 'Type', 'Location', 'Condition', 'Issue']} />{assets.map((a) => <div className="table-row" key={a.id}><div><strong>{a.name}</strong><span>Asset ID · {a.id.toString().padStart(3,'0')}</span></div><div>{a.type}</div><div>{a.location}</div><div><span className={`pill ${a.condition === 'Good' ? 'completed' : 'pending'}`}>{a.condition}</span></div><div>{a.issue}</div></div>)}</div></PageFrame> }
function Documents() { return <PageFrame title="Documents" subtitle="One searchable home for minutes, reports, proposals, notices and certificates." action="Upload document"><div className="document-grid">{documents.map((d) => <div className="panel document-card" key={d.title}><div className="doc-icon"><FileText size={21} /></div><div className="grow"><strong>{d.title}</strong><span>{d.category}</span><small>{d.date}</small></div><ArrowUpRight size={16} /></div>)}</div></PageFrame> }
function Announcements() { return <PageFrame title="Announcements" subtitle="Important notices for the club workspace." action="New announcement"><div className="announcement-list"><div className="panel announcement"><div className="announcement-head"><Bell size={18} /><span>Important</span><small>Aug 21, 2026</small></div><h3>KCITC digital management system is live</h3><p>The first public workspace is online. The next phase will connect the permanent database, authentication and document storage.</p></div><div className="panel announcement"><div className="announcement-head"><Bell size={18} /><span>Notice</span><small>Aug 18, 2026</small></div><h3>Management meeting scheduled</h3><p>Management Meeting #04 is scheduled for August 25 at the KCITC Room.</p></div></div></PageFrame> }
function Reports() { return <PageFrame title="Reports" subtitle="Turn structured records into Secretary-ready summaries."><div className="report-grid">{['Monthly activity report','Member attendance report','Program history','Pending-task report','IT issue report','Annual Secretary report'].map((r) => <div className="panel report-card" key={r}><div className="soft-icon"><BarChart3 size={19} /></div><div className="grow"><strong>{r}</strong><span>Ready to generate from connected records</span></div><button className="secondary">Generate</button></div>)}</div><div className="demo-banner"><div><strong>Export architecture</strong><p>PDF, Excel and CSV exports will be generated server-side once the Supabase data layer is connected.</p></div><FileText size={22} /></div></PageFrame> }
function Handover() { return <PageFrame title="Handover Center" subtitle="Make the system survive the Secretary, not depend on the Secretary."><div className="handover-hero panel"><div className="handover-icon"><ShieldCheck size={28} /></div><div className="grow"><span className="eyebrow">TERM TRANSITION</span><h2>2026–27 → 2027–28</h2><p>Records stay intact. Only the current management term changes.</p></div><button className="primary">Start new term</button></div><div className="check-grid">{['Members & management history','Meetings & minutes','Programs & event reports','Attendance records','Documents & attachments','Tasks & open work','IT assets & issue history','Important contacts','Secretary procedures','Handover notes'].map((x) => <div className="check-card" key={x}><CheckCircle2 size={18} /><span>{x}</span><ChevronRight size={15} /></div>)}</div><div className="architecture panel"><div><span className="eyebrow">PERMANENT ARCHITECTURE</span><h3>KCITC Digital Management System</h3><p>Current Secretary is a role, not the owner of the data. Future Secretaries inherit the same workspace and historical records.</p></div><div className="architecture-flow"><span>KCITC</span><ChevronRight/><span>Term</span><ChevronRight/><span>Records</span><ChevronRight/><span>Next Secretary</span></div></div></PageFrame> }

function PageFrame({ title, subtitle, action, onAction, children }) { return <><section className="page-intro"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="primary" onClick={onAction}><Plus size={17} /> {action}</button>}</section>{children}</> }
function TableHead({ cols }) { return <div className="table-head">{cols.map((c) => <span key={c}>{c}</span>)}</div> }

function Modal({ type, onClose, onSubmit }) {
  const [form, setForm] = useState(type === 'members' ? { name: '', role: 'Member', className: '', section: '' } : type === 'tasks' ? { title: '', assignee: 'Anim Katwal', priority: 'Medium', deadline: 'Aug 30, 2026' } : { title: '', date: 'Sep 01, 2026', venue: 'KCITC Room' })
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const title = type === 'members' ? 'Add member' : type === 'tasks' ? 'Add task' : 'Create program'
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">DEMO SESSION</span><h2>{title}</h2></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{type === 'members' && <><label>Name<input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" /></label><div className="form-grid"><label>Role<input value={form.role} onChange={(e) => set('role', e.target.value)} /></label><label>Class<input value={form.className} onChange={(e) => set('className', e.target.value)} placeholder="12" /></label><label>Section<input value={form.section} onChange={(e) => set('section', e.target.value)} placeholder="A" /></label></div></>}{type === 'tasks' && <><label>Task title<input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to be done?" /></label><div className="form-grid"><label>Assigned to<input value={form.assignee} onChange={(e) => set('assignee', e.target.value)} /></label><label>Priority<select value={form.priority} onChange={(e) => set('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Deadline<input value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></label></div></>}{type === 'events' && <><label>Program name<input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Event name" /></label><div className="form-grid"><label>Date<input value={form.date} onChange={(e) => set('date', e.target.value)} /></label><label>Venue<input value={form.venue} onChange={(e) => set('venue', e.target.value)} /></label></div></>}<div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!Object.values(form).every(Boolean)} onClick={() => onSubmit(form)}><CheckCircle2 size={17}/> Save</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)
