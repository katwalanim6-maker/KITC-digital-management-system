create extension if not exists pgcrypto;

create type app_role as enum ('admin','secretary','president','vice_president','management','member','advisor');
create type record_status as enum ('active','inactive','archived');
create type task_status as enum ('pending','in_progress','completed','cancelled');
create type priority_level as enum ('low','medium','high','urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role app_role not null default 'member',
  account_status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  class_name text,
  section text,
  phone text,
  email text,
  position_title text,
  join_date date,
  status record_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.management_terms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.management_members (
  term_id uuid not null references public.management_terms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  position_title text not null,
  primary key (term_id, member_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date timestamptz not null,
  location text,
  agenda text,
  minutes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.meeting_attendees (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  attendance_status text not null default 'present',
  primary key (meeting_id, member_id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  decision text not null,
  responsible_member_id uuid references public.members(id),
  deadline date,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.members(id),
  priority priority_level not null default 'medium',
  deadline date,
  status task_status not null default 'pending',
  created_by uuid references public.profiles(id),
  decision_id uuid references public.decisions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date timestamptz not null,
  venue text,
  description text,
  status record_status not null default 'active',
  budget numeric(12,2),
  final_report text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  primary key (event_id, member_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  attendance_date date not null,
  status text not null,
  check (meeting_id is not null or event_id is not null)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  asset_name text not null,
  asset_type text,
  location text,
  serial_number text,
  condition text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  description text,
  category text,
  priority priority_level not null default 'medium',
  status task_status not null default 'pending',
  assigned_to uuid references public.members(id),
  resolution text,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.management_terms enable row level security;
alter table public.management_members enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendees enable row level security;
alter table public.decisions enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.attendance enable row level security;
alter table public.assets enable row level security;
alter table public.issues enable row level security;
alter table public.documents enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_logs enable row level security;

-- Policy layer is intentionally added after the information model is reviewed.
-- This prevents the frontend prototype from accidentally defining production permissions.
