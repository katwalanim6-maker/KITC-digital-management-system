# KITC Digital Management System

KITC Secretary Hub with a public landing page, a separate role-aware access screen, a browser-based Secretary Desk and USB-backed institutional records.

https://katwalanim6-maker.github.io/KITC-digital-management-system/

## Current architecture

- `index.html` is the public landing page and project entry point.
- `access.html` is the separate Member / Executive / Admin role-selection screen.
- `secretary-desk.html` is the authenticated Secretary workspace and Admin login boundary.
- `src/main.js` manages the existing USB-backed KITC records and writes JSON data to the USB `database/` folder.
- `src/secretary-suite.js` provides Secretary-specific read-only workflows such as follow-ups, decisions, journal, letters and templates, while preserving export/report/handover utilities.
- The reusable Universal Admin Panel is loaded from the separate Admin repository and embedded into the Secretary Desk.
- `src/kitc-admin-panel.js` is the KITC adapter between the generic panel and the existing KITC USB data.
- `src/login-selector.js` powers the separate access-screen role selector and keeps Member / Executive authentication explicitly unconfigured until real providers are connected.

The Admin Panel does **not** own KITC data. It reads and writes the same KITC USB records through the adapter.

## Public entry and access selection

The public GitHub Pages root opens the KITC landing page. The landing page sends users to `access.html`.

The access screen asks **Choose your workspace** and provides Member, Executive and Admin choices.

- **Admin** continues to the existing `secretary-desk.html` Admin Login, which requires the KITC Secretary USB and Admin password.
- **Member** and **Executive** show explicit not-configured messages rather than bypassing authentication. Their real login providers can be connected later without changing the reusable Admin Panel.

The Secretary Desk is the protected Admin/Secretary workspace.

## Admin access

The existing Secretary USB + password gate is the admin access boundary. After unlock, use **Admin Panel** in the sidebar.

The Universal Panel provides the centralized CRUD surface. Admin permissions expose Create, Update and Delete controls for KITC resources. The Admin dashboard also provides **View as Member**, a read-only member-experience preview with selectable member records.

Normal/read-only access remains separate from admin authorization. UI controls are not a security boundary; protected production data should enforce permissions at the storage/backend layer as well.

## Secretary Desk permissions

The Secretary Desk is intentionally read-only for record management. Add, Edit and Delete controls have been removed from the dashboard, record pages and Secretary-suite record pages. CRUD is centralized in the Admin Panel instead.

Reports, USB backups, document export and handover utilities remain available because they do not modify the underlying record through CRUD forms.

## USB synchronization

KITC uses the browser File System Access API for the USB workflow. The browser asks the user to explicitly select the KITC folder and grant access. The admin adapter uses the existing `kitcSave()` path, so edits made through the Admin Panel are written back to the same USB JSON files used by the Secretary Desk.

The admin integration checks the USB JSON files periodically and reloads changed records so the panel can react when a file changes outside the panel while the authorized USB handle remains available.

This browser capability requires a supported browser and secure context (normally HTTPS), and the user must explicitly grant directory access.

## Reusable Admin Panel

The generic panel lives in the separate Admin repository. It provides the shell, navigation, generic resource UI, CRUD controls, permission-aware UI and a host-project adapter boundary. KITC supplies the data and authentication context.

Keep project-specific business logic in this repository, not in the reusable Admin Panel core.

## Existing data model

The USB database uses JSON records for members, meetings, tasks, events, attendance, issues and documents, with additional Secretary-suite records such as follow-ups, decisions, journal entries, letters, timelines and meeting templates.

## Public design standards

The public KITC site and shared KITC visual layer should remain deliberate and restrained:

- No purple gradients or decorative color washes.
- No pill-shaped controls or badges.
- No fake reviews, testimonials, customer counts or fabricated usage metrics.
- No emoji characters as primary interface icons.
- No vague marketing claims when a concrete description is available.
- No em dashes in public copy.
- No cursor-following effects or unnecessary scroll animations.
- No AI-generated decorative photography or filler imagery.
- No AI-generated filler copy.
- No fake activity, fake records or invented operational claims presented as real.
- Keep controls rectangular with modest corner radii and clear borders.
- Prefer real project terminology and explain what the system actually does.
- Preserve accessibility, responsive behavior and reduced-motion support.

The public landing page now describes the real modules without presenting invented statistics. The shared KITC theme also uses a neutral dark palette without purple gradients or excessive glass effects.

## Legal pages

- `privacy.html` contains the public privacy policy.
- `terms.html` contains the public terms and conditions.
- `favicon.svg` provides the project favicon.

## AI development instructions

Before modifying this repository:

1. Read this README completely.
2. Preserve the existing Secretary Desk and USB data architecture unless a change explicitly requires otherwise.
3. Keep the Universal Admin Panel generic; KITC-specific logic belongs in the KITC adapter/integration.
4. Do not expose secrets or service-role credentials in frontend files.
5. Validate changed JavaScript/HTML and inspect the final repository state.
6. Follow the public design standards above.
7. Update this README with a brief description of **every commit/change**.
8. Keep the code change and its README changelog entry in the same commit where practical.

## Changelog

### 2026-09-05 — Refine public design and legal pages
- Reworked the public landing page with a restrained dark interface, rectangular controls and concrete KITC system copy.
- Removed purple gradients, gradient headline treatment, pill-shaped eyebrow styling, decorative emoji icons, fake dashboard numbers and excessive visual effects from the public page.
- Added `favicon.svg`, `privacy.html` and `terms.html` and linked the legal pages from the public footer.
- Removed decorative blur and purple gradient treatments from the shared KITC theme while preserving responsive behavior and the existing Secretary Desk architecture.

### 2026-09-05 — Remove legacy Secretary CRUD scripts to prevent button flash
- Removed the legacy `documents.js`, `members.js` and `member-profile.js` scripts from `secretary-desk.html`.
- These older modules still contained Add/Edit/Delete UI and were executing after the new read-only renderer, causing CRUD buttons to appear briefly before the CSS guard hid them.
- The Secretary Desk now loads only the read-only core/suite modules plus the centralized Admin Panel integration.

### 2026-09-05 — Hard-hide all Secretary Desk Add/Edit/Update controls
- Added a final read-only UI guard to the Secretary Desk content area so Add, Edit, Update and quick-add controls are hidden even if an older page script still injects them.
- Scoped the guard to `#content` so the Universal Admin Panel remains the dedicated CRUD surface.
- Kept non-CRUD actions such as search, reports, backup, export and handover available.

### 2026-09-05 — Centralize CRUD in Admin Panel and add Member View preview
- Removed Add, Edit and Delete controls from the main Secretary Desk record pages so they are read-only.
- Removed Secretary-suite create/edit controls and kept only non-CRUD utilities such as report generation, letter export and handover.
- Expanded the KITC Admin adapter so the centralized Admin Panel can CRUD the Secretary-suite records too.
- Added a read-only **View as Member** preview from the Admin Panel, including member selection and a member-style overview of events, tasks and attendance.
- Preserved the USB-backed source of truth and reusable Universal Admin Panel boundary.

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
