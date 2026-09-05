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

The Admin Login is presented as a dedicated protected-workspace screen with responsive desktop/mobile layouts, a clear USB → password → workspace flow, connection state, password visibility control, accessible status messaging and a direct return to workspace selection. The authentication behavior remains the existing USB manifest + password-verifier boundary; the redesign does not add fake authentication or expose credentials.

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

### 2026-09-05 — Hard-fix authenticated KITC logo sizing
- Added high-specificity, `!important` size constraints directly to the Secretary Desk page for the sidebar and mobile topbar logo images.
- Prevented intrinsic image dimensions or other global image rules from allowing the KITC logo to expand over the authenticated workspace.
- Kept the Admin Login logo styling separate from the authenticated workspace logo.

### 2026-09-05 — Fix oversized KITC logo after Admin unlock
- Constrained the authenticated Secretary Desk sidebar and mobile topbar KITC logos to fixed responsive dimensions.
- Added `object-fit: contain` and max-size guards so the source logo cannot expand to its intrinsic image dimensions and cover the workspace.
- Kept the Admin Login branding unchanged.

### 2026-09-05 — Make Admin unlock button reliably clickable
- Removed the native `disabled` state from the Admin unlock button, which could prevent the button from receiving a click after USB connection state changes in some browser/runtime conditions.
- Replaced it with an explicit `aria-disabled` + visual state while keeping the JavaScript guard as the actual access check.
- Kept the USB connection requirement, password verification and protected workspace boundary intact.
- Preserved the password visibility control and existing USB manifest authentication behavior.

### 2026-09-05 — Repair Admin unlock interaction
- Hardened the Admin USB/password unlock state so the button tracks an explicit connected-USB state instead of relying only on DOM state.
- Improved password verification feedback, focus behavior and error reporting so failed unlocks are visible instead of appearing unresponsive.
- Switched cryptography and UUID calls to the explicit `window.crypto` APIs for better browser compatibility.
- Added the password visibility toggle directly to the USB gate logic so the control works independently of the public role-selector script.
- Preserved the existing USB manifest, SHA-256 password verifier and protected workspace boundary.

### 2026-09-05 — Polish Admin Login experience
- Reworked the protected Admin Login into a responsive desktop/mobile two-panel experience with KITC branding, security context and a clear USB → password → workspace progression.
- Added a direct return link to the workspace selection screen and kept Member / Executive authentication unchanged.
- Added password visibility control and accessible live status messaging.
- Updated the USB gate so Admin unlock remains disabled until a valid KITC USB folder is connected, with clearer connected/new-USB guidance and preserved password-verifier behavior.
- Kept the existing USB + password authentication boundary and did not introduce client-side fake authentication or expose credentials.

### 2026-09-05 — Add public landing and separate access flow
- Replaced the GitHub Pages root redirect with a responsive KITC public landing page explaining the system, capabilities and architecture.
- Added `access.html` as a separate role-aware entry screen for Member, Executive and Admin access.
- Moved the role-selector behavior into `src/login-selector.js` so the public access screen owns role selection while the Secretary Desk remains an Admin-only authenticated workspace.
- Kept Member and Executive authentication explicitly unconfigured instead of bypassing authentication.
- Simplified `secretary-desk.html` to focus on the existing USB + password Admin boundary and protected Secretary workspace.
- Updated the Pages workflow to validate the new landing/access/desk separation and JavaScript syntax.
- Preserved the reusable Universal Admin Panel as a separate generic component with KITC-specific integration remaining in `src/kitc-admin-panel.js`.
