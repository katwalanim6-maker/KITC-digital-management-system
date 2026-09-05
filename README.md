# KITC Digital Management System

KITC Secretary Hub with a browser-based Secretary Desk and USB-backed institutional records.

https://katwalanim6-maker.github.io/KITC-digital-management-system/

## Current architecture

- `secretary-desk.html` is the Secretary workspace.
- `src/main.js` manages the existing USB-backed KITC records and writes JSON data to the USB `database/` folder.
- `src/secretary-suite.js` provides Secretary-specific workflows such as follow-ups, decisions, journal, letters, templates and handover.
- The reusable Universal Admin Panel is loaded from the separate Admin repository and embedded into the Secretary Desk.
- `src/kitc-admin-panel.js` is the KITC adapter between the generic panel and the existing KITC USB data.
- `src/login-selector.js` controls the first-step Member / Executive / Admin access selector.

The Admin Panel does **not** own KITC data. It reads and writes the same KITC USB records through the adapter.

## Login / access selection

The first screen asks **What type of user are you?** and provides Member, Executive and Admin choices.

- **Admin** opens the existing KITC USB + password authentication flow and, after unlock, provides the Universal Admin Panel with CRUD access.
- **Member** and **Executive** currently show an explicit not-configured message rather than bypassing authentication. Their real login providers can be connected later without changing the reusable Admin Panel.

## Admin access

The existing Secretary USB + password gate is the admin access boundary. After unlock, use **🔐 Admin Panel** in the sidebar.

The Universal Panel receives KITC resources such as Members, Meetings, Tasks, Programs & Events, Attendance, Documents and IT/Assets. Admin permissions expose Create, Update and Delete controls.

Normal/read-only access must remain separate from admin authorization. UI controls are not a security boundary; protected production data should enforce permissions at the storage/backend layer as well.

## USB synchronization

KITC uses the browser File System Access API for the USB workflow. The browser asks the user to explicitly select the KITC folder and grant access. The admin adapter uses the existing `kitcSave()` path, so edits made through the Admin Panel are written back to the same USB JSON files used by the Secretary Desk.

The admin integration also checks the USB JSON files periodically and reloads changed records so the panel can react when a file changes outside the panel while the authorized USB handle remains available.

This browser capability requires a supported browser and secure context (normally HTTPS), and the user must explicitly grant directory access.

## Reusable Admin Panel

The generic panel lives in the separate Admin repository. It provides the shell, navigation, generic resource UI, CRUD controls, permission-aware UI and a host-project adapter boundary. KITC supplies the data and authentication context.

Keep project-specific business logic in this repository, not in the reusable Admin Panel core.

## Existing data model

The USB database currently uses JSON records for members, meetings, tasks, events, attendance, issues and documents, with additional Secretary-suite records such as follow-ups, decisions, journal entries, letters, timelines and meeting templates.

## AI development instructions

Before modifying this repository:

1. Read this README completely.
2. Preserve the existing Secretary Desk and USB data architecture unless a change explicitly requires otherwise.
3. Keep the Universal Admin Panel generic; KITC-specific logic belongs in the KITC adapter/integration.
4. Do not expose secrets or service-role credentials in frontend files.
5. Validate changed JavaScript/HTML and inspect the final repository state.
6. Update this README with a brief description of **every commit/change**.
7. Keep the code change and its README changelog entry in the same commit.

## Changelog

### 2026-09-05 — Repair mobile login gate CSS
- Fixed the missing `.kitc-gate-logo` sizing rule that allowed the full-size logo image to overflow the login card on mobile.
- Added contained, responsive logo dimensions so the role selector stays inside the centered login card.
- Added a smaller mobile logo size for narrow screens.