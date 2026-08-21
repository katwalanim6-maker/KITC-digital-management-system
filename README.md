# KCITC Digital Management System

A permanent digital management workspace for KCITC. The current prototype is intentionally frontend-first and uses realistic seeded data so the complete information architecture can be reviewed before connecting Supabase.

## Included
- Dashboard with priorities, upcoming programs, recent activity and system health
- Members and member profiles data model
- Meetings, agendas and attendance overview
- Tasks with assignment, priority, deadline and status interactions
- Events and programs
- Attendance
- IT / Assets with PC-27 issue tracking concept
- Documents and records categories
- Announcements
- Reports and export actions
- Secretary Handover Center
- Settings and role/permission model
- Responsive mobile navigation
- Global search across seeded records

## Architecture roadmap
The next production phase should connect Supabase Auth, PostgreSQL tables, Storage and Row Level Security. The frontend has been kept modular so those data services can replace the seeded records without redesigning the application.

## Run locally

```bash
npm install
npm run dev
```

## Roles
Secretary: full access  
President: overview + approvals  
Vice-President: tasks + events  
Management: relevant records  
Member: limited access  
Advisor: reports + oversight

## Principle
This is **KCITC Digital Management System**, not a personal Secretary website. A management term changes; the club's institutional history remains.
