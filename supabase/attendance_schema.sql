create extension if not exists pgcrypto;

create table if not exists public.attendance_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role text not null default 'viewer' check (role in ('admin','teacher','viewer')),
  status text not null default 'active' check (status in ('active','inactive')),
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_role_permissions (
  role text not null check (role in ('admin','teacher','viewer')),
  permission text not null,
  primary key(role,permission)
);

create table if not exists public.attendance_teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  specialization text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid references public.attendance_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  section text,
  academic_year text not null,
  teacher_id uuid references public.attendance_teachers(id) on delete set null,
  teacher_name text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid references public.attendance_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_name,section,academic_year)
);

create table if not exists public.attendance_students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  roll_number text not null unique,
  class_id uuid references public.attendance_classes(id) on delete set null,
  class_name text,
  section text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  attendance_percentage numeric(5,2) not null default 0 check(attendance_percentage between 0 and 100),
  created_by uuid references public.attendance_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.attendance_students(id) on delete cascade,
  attendance_date date not null,
  status text not null check(status in ('present','absent')),
  recorded_by uuid references public.attendance_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id,attendance_date)
);

create table if not exists public.attendance_activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.attendance_profiles(id),
  user_name text,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attendance_students_name_idx on public.attendance_students(full_name);
create index if not exists attendance_students_class_idx on public.attendance_students(class_id,section);
create index if not exists attendance_records_date_idx on public.attendance_records(attendance_date);
create index if not exists attendance_records_student_idx on public.attendance_records(student_id,attendance_date);
create index if not exists attendance_logs_created_idx on public.attendance_activity_logs(created_at desc);

insert into public.attendance_role_permissions(role,permission) values
('teacher','view_students'),('teacher','view_teachers'),('teacher','view_classes'),('teacher','view_attendance'),('teacher','create_attendance'),('teacher','view_reports'),
('viewer','view_students'),('viewer','view_teachers'),('viewer','view_classes'),('viewer','view_attendance'),('viewer','view_reports')
on conflict do nothing;

create or replace function public.attendance_has_permission(p text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.attendance_profiles p
    where p.id = auth.uid() and p.status='active' and
      (p.role='admin' or exists(select 1 from public.attendance_role_permissions rp where rp.role=p.role and rp.permission=p))
  );
$$;

create or replace function public.attendance_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$ select role from public.attendance_profiles where id=auth.uid() and status='active'; $$;

create or replace function public.attendance_bootstrap_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.attendance_profiles(id,full_name,email)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(coalesce(new.email,''),'@',1)),new.email)
  on conflict(id) do update set email=excluded.email;
  return new;
end;
$$;

drop trigger if exists attendance_on_auth_user on auth.users;
create trigger attendance_on_auth_user
after insert on auth.users
for each row execute function public.attendance_bootstrap_profile();

create or replace function public.attendance_update_timestamps()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

drop trigger if exists attendance_profiles_updated on public.attendance_profiles;
create trigger attendance_profiles_updated before update on public.attendance_profiles for each row execute function public.attendance_update_timestamps();
drop trigger if exists attendance_students_updated on public.attendance_students;
create trigger attendance_students_updated before update on public.attendance_students for each row execute function public.attendance_update_timestamps();
drop trigger if exists attendance_teachers_updated on public.attendance_teachers;
create trigger attendance_teachers_updated before update on public.attendance_teachers for each row execute function public.attendance_update_timestamps();
drop trigger if exists attendance_classes_updated on public.attendance_classes;
create trigger attendance_classes_updated before update on public.attendance_classes for each row execute function public.attendance_update_timestamps();
drop trigger if exists attendance_records_updated on public.attendance_records;
create trigger attendance_records_updated before update on public.attendance_records for each row execute function public.attendance_update_timestamps();

create or replace function public.attendance_log_correction()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='UPDATE' and old.status is distinct from new.status then
    insert into public.attendance_activity_logs(user_id,user_name,action,target_type,target_id,metadata)
    values(auth.uid(),(select full_name from public.attendance_profiles where id=auth.uid()),'attendance_corrected','attendance',new.id,
      jsonb_build_object('student_id',new.student_id,'date',new.attendance_date,'from',old.status,'to',new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_correction_audit on public.attendance_records;
create trigger attendance_correction_audit after update on public.attendance_records for each row execute function public.attendance_log_correction();

create or replace function public.attendance_refresh_percentage(p_student uuid)
returns void language sql security definer set search_path=public as $$
  update public.attendance_students s set attendance_percentage=coalesce((select round(100.0*count(*) filter(where status='present')/nullif(count(*),0),2) from public.attendance_records r where r.student_id=p_student),0) where s.id=p_student;
$$;

create or replace function public.attendance_after_record_change()
returns trigger language plpgsql security definer set search_path=public as $$ begin perform public.attendance_refresh_percentage(coalesce(new.student_id,old.student_id)); return coalesce(new,old); end $$;

drop trigger if exists attendance_refresh_student_percentage on public.attendance_records;
create trigger attendance_refresh_student_percentage after insert or update or delete on public.attendance_records for each row execute function public.attendance_after_record_change();

alter table public.attendance_profiles enable row level security;
alter table public.attendance_role_permissions enable row level security;
alter table public.attendance_students enable row level security;
alter table public.attendance_teachers enable row level security;
alter table public.attendance_classes enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_activity_logs enable row level security;

-- Profiles: users can read their own profile; admins can manage all profiles.
drop policy if exists attendance_profiles_self on public.attendance_profiles;
create policy attendance_profiles_self on public.attendance_profiles for select using(id=auth.uid() or public.attendance_current_role()='admin');
drop policy if exists attendance_profiles_admin_write on public.attendance_profiles;
create policy attendance_profiles_admin_write on public.attendance_profiles for update using(public.attendance_current_role()='admin') with check(public.attendance_current_role()='admin');

-- Permission definitions are readable to authenticated users, but writable only by database owners/migrations.
drop policy if exists attendance_permissions_read on public.attendance_role_permissions;
create policy attendance_permissions_read on public.attendance_role_permissions for select using(auth.uid() is not null);

-- Students.
drop policy if exists attendance_students_read on public.attendance_students;
create policy attendance_students_read on public.attendance_students for select using(public.attendance_has_permission('view_students'));
drop policy if exists attendance_students_insert on public.attendance_students;
create policy attendance_students_insert on public.attendance_students for insert with check(public.attendance_has_permission('create_students'));
drop policy if exists attendance_students_update on public.attendance_students;
create policy attendance_students_update on public.attendance_students for update using(public.attendance_has_permission('edit_students') or public.attendance_has_permission('archive_students')) with check(public.attendance_has_permission('edit_students') or public.attendance_has_permission('archive_students'));
drop policy if exists attendance_students_delete on public.attendance_students;
create policy attendance_students_delete on public.attendance_students for delete using(public.attendance_current_role()='admin');

-- Teachers.
drop policy if exists attendance_teachers_read on public.attendance_teachers;
create policy attendance_teachers_read on public.attendance_teachers for select using(public.attendance_has_permission('view_teachers'));
drop policy if exists attendance_teachers_insert on public.attendance_teachers;
create policy attendance_teachers_insert on public.attendance_teachers for insert with check(public.attendance_has_permission('create_teachers'));
drop policy if exists attendance_teachers_update on public.attendance_teachers;
create policy attendance_teachers_update on public.attendance_teachers for update using(public.attendance_has_permission('edit_teachers') or public.attendance_has_permission('archive_teachers')) with check(public.attendance_has_permission('edit_teachers') or public.attendance_has_permission('archive_teachers'));
drop policy if exists attendance_teachers_delete on public.attendance_teachers;
create policy attendance_teachers_delete on public.attendance_teachers for delete using(public.attendance_current_role()='admin');

-- Classes.
drop policy if exists attendance_classes_read on public.attendance_classes;
create policy attendance_classes_read on public.attendance_classes for select using(public.attendance_has_permission('view_classes'));
drop policy if exists attendance_classes_insert on public.attendance_classes;
create policy attendance_classes_insert on public.attendance_classes for insert with check(public.attendance_has_permission('create_classes'));
drop policy if exists attendance_classes_update on public.attendance_classes;
create policy attendance_classes_update on public.attendance_classes for update using(public.attendance_has_permission('edit_classes') or public.attendance_has_permission('archive_classes')) with check(public.attendance_has_permission('edit_classes') or public.attendance_has_permission('archive_classes'));
drop policy if exists attendance_classes_delete on public.attendance_classes;
create policy attendance_classes_delete on public.attendance_classes for delete using(public.attendance_current_role()='admin');

-- Attendance. Reading is separate from writing and correction.
drop policy if exists attendance_records_read on public.attendance_records;
create policy attendance_records_read on public.attendance_records for select using(public.attendance_has_permission('view_attendance'));
drop policy if exists attendance_records_insert on public.attendance_records;
create policy attendance_records_insert on public.attendance_records for insert with check(public.attendance_has_permission('create_attendance'));
drop policy if exists attendance_records_update on public.attendance_records;
create policy attendance_records_update on public.attendance_records for update using(public.attendance_has_permission('correct_attendance')) with check(public.attendance_has_permission('correct_attendance'));
drop policy if exists attendance_records_delete on public.attendance_records;
create policy attendance_records_delete on public.attendance_records for delete using(public.attendance_current_role()='admin');

-- Audit logs: users can insert their own client-side operational logs; only admins can read them.
drop policy if exists attendance_logs_insert on public.attendance_activity_logs;
create policy attendance_logs_insert on public.attendance_activity_logs for insert with check(user_id=auth.uid());
drop policy if exists attendance_logs_read on public.attendance_activity_logs;
create policy attendance_logs_read on public.attendance_activity_logs for select using(public.attendance_current_role()='admin');
drop policy if exists attendance_logs_delete on public.attendance_activity_logs;
create policy attendance_logs_delete on public.attendance_activity_logs for delete using(false);

-- First administrator bootstrap: after creating the first account, run this once as the project owner.
-- update public.attendance_profiles set role='admin' where email='YOUR_ADMIN_EMAIL';
