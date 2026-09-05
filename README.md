# KITC Digital Management System

KITC Secretary Hub with a browser-based Secretary Desk and USB-backed institutional records.

## Current architecture

- `secretary-desk.html` is the Secretary workspace.
- `src/main.js` manages the existing USB-backed KITC records and writes JSON data to the USB `database/` folder.
- `src/secretary-suite.js` provides Secretary-specific workflows such as follow-ups, decisions, journal, letters, templates and handover.
- The reusable Universal Admin Panel is loaded from the separate Admin repository and embedded into the Secretary Desk.
- `src/kitc-admin-panel.js` is the KITC adapter between the generic panel and the existing KITC USB data.

The Admin Panel does **not** own KITC data. It reads and writes the same KITC USB records through the adapter.

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

### 2026-09-05 — Admin adapter compatibility fix
- Fixed the KITC Admin adapter so existing normalized `values` records are mapped into the Universal Panel's named table fields.
- Ensured Admin Panel create/update operations convert records back to the Secretary Desk's existing USB JSON format.

### 2026-09-05 — Embedded Universal Admin Panel
- Added the upgraded reusable Admin Panel integration to the KITC Secretary Desk.
- Connected Admin Panel resource CRUD to the existing KITC USB-backed records.
- Added periodic USB change detection so external record edits can refresh the admin view.
- Added an Admin Panel entry inside the Secretary Desk after the existing USB/password unlock.
- Added the missing `kitcSetupHint` element required by the USB gate.
