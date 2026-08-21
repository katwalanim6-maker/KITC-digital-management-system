-- KCITC Digital Management System
-- Permanent data model for Supabase/PostgreSQL.
-- RLS is enabled so a future public site does NOT accidentally expose private records.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'member' check (role in ('president','secretary','vice_president','management','member','advisor','admin')),
  account_status text not null default 'active' check (account_status in ('active','suspended','invited')),
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  class_name text,
  section text,
  phone text,
  email text,
  position text,
  join_date date,
  status text not null default 'active' check (status in ('active','inactive','alumni')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists management_terms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists management_members (
  term_id uuid not null references management_terms(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  position text not null,
  primary key (term_id, member_id)
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date timestamptz not null,
  location text,
  agenda text,
  minutes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists meeting_attendees (
  meeting_id uuid not null references meetings(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'present' check (status in ('present','absent','late','excused')),
  primary key (meeting_id, member_id)
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  decision text not null,
  responsible_member_id uuid references members(id),
  deadline date,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references members(id),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  deadline date,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date timestamptz not null,
  venue text,
  description text,
  status text not null default 'upcoming' check (status in ('draft','upcoming','ongoing','completed','cancelled')),
  budget numeric(12,2),
  report text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists event_participants (
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','present','absent')),
  primary key (event_id, member_id)
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  meeting_id uuid references meetings(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  created_at timestamptz not null default now(),
  check ((meeting_id is not null) or (event_id is not null))
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  file_path text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  asset_type text,
  location text,
  serial_number text,
  condition text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  title text not null,
  description text,
  category text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','in_progress','resolved','closed')),
  assigned_to uuid references members(id),
  resolution text,
  reported_by uuid references profiles(id),
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_name on members(name);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_deadline on tasks(deadline);
create index if not exists idx_events_date on events(event_date);
create index if not exists idx_meetings_date on meetings(meeting_date);
create index if not exists idx_issues_status on issues(status);

-- Security baseline: authenticated users can only access data after explicit policies are added.
-- Do NOT disable RLS on a production/public project.
alter table profiles enable row level security;
alter table members enable row level security;
alter table management_terms enable row level security;
alter table management_members enable row level security;
alter table meetings enable row level security;
alter table meeting_attendees enable row level security;
alter table decisions enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table attendance enable row level security;
alter table documents enable row level security;
alter table assets enable row level security;
alter table issues enable row level security;
alter table announcements enable row level security;
alter table activity_logs enable row level security;
