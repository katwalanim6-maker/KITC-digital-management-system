# KCITC Digital Management System

A permanent Secretary OS for KCITC — designed to survive management terms, preserve institutional memory and make handover simple.

## What is included in this restart

- Modern responsive dashboard
- Members and management workspace
- Meetings and searchable meeting history
- Tasks with status and priorities
- Programs & Events records
- Attendance overview
- IT / asset inventory and issue tracking
- Documents area
- Announcements
- Reports architecture
- Secretary Handover Center
- Global search UI
- Mobile navigation and quick-add flows
- GitHub Pages deployment from `main`
- Supabase/PostgreSQL schema with Row Level Security enabled

## Public site

The repository is public and the Pages build is configured for the repository path:

`https://katwalanim6-maker.github.io/KITC-digital-management-system/`

GitHub Pages must use **GitHub Actions** as its source. The workflow in `.github/workflows/deploy-pages.yml` builds and deploys on every push to `main`.

## Important architecture decision

The current public build intentionally uses demo records in React state. It does **not** pretend that browser state is the permanent database.

The permanent backend is prepared around:

- Supabase Auth for accounts
- PostgreSQL for connected records
- Supabase Storage for documents/photos
- Row Level Security for role-based access
- Activity logs for accountability

Run `supabase/schema.sql` in the Supabase SQL editor when the project is created, then add the project's URL and anon key as GitHub Actions repository secrets/environment variables before wiring the frontend to live data.

## Roles planned

- President — overview and approvals
- Secretary — full administrative access
- Vice-President — management, tasks and events
- Management — relevant records
- Member — limited access
- Advisor — oversight/report access
- Admin — system administration

## Development

```bash
npm install
npm run dev
```

Build locally with:

```bash
npm run build
```

## Next backend phase

1. Create the Supabase project.
2. Run `supabase/schema.sql`.
3. Add authentication and profiles.
4. Add role-aware RLS policies.
5. Replace demo state with Supabase queries/mutations.
6. Add Storage buckets for documents and event media.
7. Add PDF/CSV/XLSX export.
8. Add term transition automation and full audit history.

The core principle is: **KCITC owns the system; the current Secretary is only the current role.**
