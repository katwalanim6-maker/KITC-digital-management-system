# KITC Digital Management System

KITC Secretary Hub with a public landing page, a separate role-aware access screen, a browser-based Secretary Desk and USB-backed institutional records.

https://katwalanim6-maker.github.io/KITC-digital-management-system/

## Current architecture

- `index.html` is the public landing page and project entry point.
- `access.html` is the separate Member / Executive / Admin role-selection screen.
- `secretary-desk.html` is the authenticated Secretary workspace and Admin login boundary.
- `src/main.js` manages the existing USB-backed KITC records and writes JSON data to the USB `database/` folder.
- `src/secretary-suite.js` provides Secretary-specific workflows such as follow-ups, decisions, journal, letters, templates and handover.
- The reusable Universal Admin Panel is loaded from the separate Admin repository and embedded into the Secretary Desk.
- `src/kitc-admin-panel.js` is the KITC adapter between the generic panel and the existing KITC USB data.
- `src/login-selector.js` powers the separate access-screen role selector and keeps Member / Executive authentication explicitly unconfigured until real providers are connected.

The Admin Panel does **not** own KITC data. It reads and writes the same KITC USB records through the adapter.

## Public entry and access selection

The public GitHub Pages root now opens the KITC landing page rather than the Secretary Desk. The landing page explains the system and sends users to `access.html`.

The access screen asks **Choose your workspace** and provides Member, Executive and Admin choices.

- **Admin** continues to the existing `secretary-desk.html` Admin Login, which requires the KITC Secretary USB and Admin password.
- **Member** and **Executive** show explicit not-configured messages rather than bypassing authentication. Their real login providers can be connected later without changing the reusable Admin Panel.

The Secretary Desk no longer carries the public role selector. It is the authenticated Admin workspace only, which keeps the public entry flow and protected operational workspace separate.

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

### 2026-09-05 — Add public landing and separate access flow
- Replaced the GitHub Pages root redirect with a responsive KITC public landing page explaining the system, capabilities and architecture.
- Added `access.html` as a separate role-aware entry screen for Member, Executive and Admin access.
- Moved the role-selector behavior into `src/login-selector.js` so the public access screen owns role selection while the Secretary Desk remains an Admin-only authenticated workspace.
- Kept Member and Executive authentication explicitly unconfigured instead of bypassing authentication.
- Simplified `secretary-desk.html` to focus on the existing USB + password Admin boundary and protected Secretary workspace.
- Updated the Pages workflow to validate the new landing/access/desk separation and JavaScript syntax.
- Preserved the reusable Universal Admin Panel as a separate generic component with KITC-specific integration remaining in `src/kitc-admin-panel.js`.
