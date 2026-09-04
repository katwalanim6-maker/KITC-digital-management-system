# KITC Attendance Admin

The repository now contains a responsive attendance administration console at the root `index.html`. The previous Secretary Desk is preserved at `secretary-desk.html`.

## Stack

- Vanilla HTML/CSS/JavaScript
- Supabase Auth + PostgreSQL + Row Level Security
- Supabase Edge Function for secure user invitations
- No service-role credential in browser code

## First-time setup

1. Open the Supabase SQL editor for the project used by this repository.
2. Run `supabase/attendance_schema.sql`.
3. Create the first account using Supabase Auth email/password.
4. Promote that first account once, as the project owner, with:

```sql
update public.attendance_profiles
set role='admin'
where email='YOUR_ADMIN_EMAIL';
```

5. Deploy `supabase/functions/invite-user/index.ts` as the `invite-user` Edge Function. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions; the service-role key must never be copied into client-side files.
6. Open the application and sign in.

## Security model

The UI uses role/permission checks for navigation and action affordances, but those checks are not the security boundary. PostgreSQL RLS policies enforce access for students, teachers, classes, attendance, profiles and logs.

Attendance corrections are audited by a database trigger. Archive is the normal lifecycle for important records. Permanent delete is limited to admin-level database policies and is not exposed as a normal workflow in the UI.

## Roles

- **Admin:** full administrative access.
- **Teacher:** attendance operations plus read access according to seeded permissions.
- **Viewer:** read-only access to the modules covered by seeded permissions.

The permission table is intentionally separate so the role model can be expanded without turning frontend visibility into the authorization mechanism.
