# Parish Connect — System Documentation

**Product:** Parish Connect **v1.0** (application label; package version `0.0.0`)<br>
**Last reviewed:** September 16, 2026 — source-verified Archive revision and affected documentation<br>
**Parish:** Immaculate Conception of the Virgin Mary Parish  
**Location:** Bani, Pangasinan  
**Diocese:** The Roman Catholic Diocese of Alaminos  

**Document purpose:** Description of the **current repository implementation**, derived from application source code. Intended for thesis panels, parish staff, and future developers. This review does not verify the deployed website, live Firebase configuration, or completed acceptance tests.<br>
**Source of truth:** Application source code under `src/`, dependency declarations, deployment configuration, and Firebase rules in the repository. The September 14 full audit is supplemented by a September 16 review of the implemented Archive revision, test fixtures, and affected sections. Archive descriptions follow executable code rather than earlier proposals.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Current Development Status](#2-current-development-status)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Application Routes](#5-application-routes)
6. [Authentication](#6-authentication)
7. [Dashboard](#7-dashboard)
8. [Calendar Management](#8-calendar-management)
9. [Baptism Records](#9-baptism-records)
10. [Confirmation Records](#10-confirmation-records)
11. [Marriage Records](#11-marriage-records)
12. [Death Records](#12-death-records)
13. [Conversion Records](#13-conversion-records)
14. [Mass Intentions](#14-mass-intentions)
15. [Ministers Management](#15-ministers-management)
16. [Reports](#16-reports)
17. [Certificate Generation](#17-certificate-generation)
18. [User Profile](#18-user-profile)
19. [Firebase Integration](#19-firebase-integration)
20. [Firestore Collections](#20-firestore-collections)
21. [Firebase Storage](#21-firebase-storage)
22. [Validation System](#22-validation-system)
23. [Search and Filtering](#23-search-and-filtering)
24. [Printing](#24-printing)
25. [Audit Information](#25-audit-information)
26. [User Interface](#26-user-interface)
27. [Error Handling](#27-error-handling)
28. [Security Features](#28-security-features)
29. [Production Optimizations](#29-production-optimizations)
30. [Business Rules](#30-business-rules)
31. [Deployment](#31-deployment)
32. [Testing](#32-testing)
33. [Known Limitations](#33-known-limitations)
34. [Future Enhancements](#34-future-enhancements)
35. [Revision History](#35-revision-history)

---

## 1. System Overview

### Project description

Parish Connect is a web-based parish administration system for **Immaculate Conception of the Virgin Mary Parish (Bani, Pangasinan)** under **The Roman Catholic Diocese of Alaminos**. It digitizes day-to-day parish office work for sacramental registers, Mass intentions, ministers, the parish calendar, official certificates, and filtered reports.

The application is a **single-page React application** configured for deployment on **Vercel**, using **Firebase Authentication**, **Cloud Firestore**, and (prepared) **Firebase Storage**. It is designed for internal parish office use.

### Objectives

- Maintain accurate sacramental and Mass Intention records in a centralized database
- Support scheduling through an interactive parish calendar
- Generate printable and PDF certificates from saved records
- Produce filtered reports for parish office use
- Enforce role-based access for Administrator and Staff accounts

### Scope (v1.0)

**In scope (implemented):** authentication and RBAC; Dashboard and calendar; Baptism, Confirmation, Marriage, Death, and Conversion registers; password-verified sacramental editing; password-and-reason Move to Trash; password-gated Archived Records with five sacramental tabs and reason-required recovery; Mass Intentions; Ministers; Reports (preview / print / PDF); Certificate Preview with print and PDF for all five sacraments, including Conversion; user profile and password change; client-side validation; Firestore and Storage security rules in the repository.

**Not implemented (see Future Enhancements):** archive actor tracking and complete archive/recovery history, QR certificate verification, OCR digitization, AI duplicate detection, native mobile apps, multi-parish tenancy, full audit-log administration UI, and related advanced features.

### Target users

| Role | Typical users | Access |
|------|---------------|--------|
| Administrator (`admin`) | Parish priest / designated office administrator | Full admin shell; create users in Firestore rules; read audit logs |
| Staff (`staff`) | Parish secretaries / office staff | Full operational modules for records, calendar, reports, certificates |

### System architecture (current)

```
Browser (React 19 + Vite + MUI)
        │
        ├── Firebase Authentication  (email/password sessions)
        ├── Cloud Firestore          (all operational data)
        └── Firebase Storage         (SDK + rules prepared; profile photo upload UI not wired)
        │
Hosting: Vercel (SPA rewrite to index.html)
Rules / project config: Firebase CLI (`firestore.rules`, `storage.rules`)
```

- **Frontend:** React SPA with React Router, Material UI, lazy-loaded routes, and browser-side PDF/print generation
- **Backend:** Firebase BaaS (no custom Node API in this repository)
- **Deployment:** GitHub repository → Vercel frontend; Firebase project for Auth, Firestore, and Storage

### Design language

The interface uses a Marian blue parish theme (`#0B3D91` and related accents), Material UI components, and shared form patterns across sacramental modules for consistent parish-office workflows.

---

## 2. Current Development Status

### Completed

“Implemented” means present in source; it does not certify production readiness, deployed rules, or successful end-to-end tests.

| Area | Status |
|------|--------|
| Authentication (email/password, roles, route protection) | ✔ Implemented |
| Dashboard (summary cards + parish calendar) | ✔ Implemented |
| Calendar management (click / double-click / past-date rules) | ✔ Implemented |
| Baptism, Confirmation, Marriage, Death, Conversion records | ✔ Implemented |
| Mass Intentions (Pending → Scheduled → Offered / Cancelled) | ✔ Implemented |
| Ministers management | ✔ Implemented |
| Reports (preview, PDF export, print, recent reports) | ✔ Implemented |
| Certificate generation (Baptism, Confirmation, Marriage, Death, Conversion) | ✔ Implemented through one shared layout |
| Certificate print via `react-to-print` (native Print Preview) | ✔ Implemented |
| Certificate PDF via html2canvas + jsPDF | ✔ Implemented |
| User profile and password change | ✔ Implemented |
| Validation, Proper Case, duplicate record numbers | ✔ Implemented |
| Unsaved changes warnings | ✔ Implemented |
| Documentary requirements checklists | ✔ Implemented |
| Password verification before sacramental edit / Move to Trash | ✔ Implemented in all five record pages |
| Sacramental Trash/Archive retention | ✔ All five pages require password + Archive Reason; transactional updates retain records and linked events |
| Archived Records menu/page | ✔ `/records/archived`; password verification before archive queries/display; five sacramental tabs |
| Recover archived records | ✔ Identity confirmation + required Recovery Reason; preserves archive metadata, status, numbering, and stored events |
| Archive access lifecycle | ✔ In-memory, account/visit-scoped; refresh, leaving/re-entry, logout, and account change require verification again |
| Archive exclusion from lists, lookups, reports, years, counts, calendar | ✔ Implemented; legacy records without the archive flag remain visible |
| Certificate Purpose and A4 print fitting | ✔ Implemented; browser/printer validation is a separate release check |
| Baptism and Confirmation book / line / page references | ✔ Implemented |
| Manual event time ranges and overlap checks | ✔ Implemented |
| Reports across all years with available-year discovery | ✔ Implemented |
| Shared About dialog and application footer | ✔ Implemented |
| Firebase Auth + Firestore data layer | ✔ Implemented |
| Firestore and Storage security rules files | ✔ Implemented in repo |
| Production code splitting / lazy loading | ✔ Implemented |
| Responsive admin layout | ✔ Implemented |
| Vercel SPA hosting configuration | ✔ Implemented |

### Not fully delivered in the current implementation

| Area | Current state |
|------|----------------|
| Archive audit/history and purge | Viewer/recovery implemented; no archive/recovery actor fields, full action history, purge UI, or automatic expiry |
| Dedicated certificate templates | Runtime uses `BaptismCertificate` for all five types; separate Confirmation/Marriage/Death components are not selected by the preview |
| Daily / Weekly Mass Intention report periods | Labels exist; only year/month/minister filters are implemented |
| Forgot-password UI | `resetPassword` service helper exists, but no page/form calls it |
| Runtime DOCX certificate export | Not implemented (DOCX files are design references only) |
| Profile photo upload via Firebase Storage | Storage SDK initialized and rules exist; **no upload UI/path in app code** |
| Mass Intention create from calendar “Create New Record” radio list | Mass Intention form path exists on Dashboard, but is **not** listed in the calendar schedule options |

---

## 3. Technology Stack

Verified from `package.json` (declared dependency versions):

### Frontend

| Technology | Declared version | Role in Parish Connect |
|------------|------------------|-------------------------|
| React | `^19.2.7` | UI library |
| React DOM | `^19.2.7` | DOM rendering |
| Vite | `^8.1.1` (dev) | Build tool and dev server |
| Material UI (`@mui/material`) | `^9.2.0` | Component library |
| MUI Icons (`@mui/icons-material`) | `^9.2.0` | Icons |
| Emotion (`@emotion/react`, `@emotion/styled`) | `^11.14.0` / `^11.14.1` | MUI styling |
| React Router DOM | `^7.18.1` | Client-side routing |
| react-to-print | `^3.3.0` | Certificate Print Preview from the preview dialog |
| jsPDF | `^4.2.1` | PDF generation (certificates & reports) |
| jsPDF AutoTable | `^5.0.8` | Tabular report PDFs |
| html2canvas | `^1.4.1` | Certificate HTML → canvas → PDF |
| phil-reg-prov-mun-brgy | `^1.1.0` | Philippine place hierarchy data |

### Backend (Firebase)

| Service | Role |
|---------|------|
| Firebase Authentication | Email/password sign-in, password change, session state; reset-email helper exists without a UI |
| Cloud Firestore | Primary database for all operational collections |
| Firebase Storage | Initialized; rules prepared for profile photos (upload UI not wired) |
| Firebase JS SDK | `^12.16.0` |

### Deployment & version control

| Technology | Role |
|------------|------|
| Git / GitHub | Source control and collaboration |
| Vercel | Frontend hosting; SPA rewrite via `vercel.json` |
| Firebase project | Auth, Firestore, Storage, and deployed security rules |

### Declared but unused in `src/`

The following appear in `package.json` but have **no imports** under `src/` in the current codebase:

- `react-hook-form`
- `react-icons`
- `sweetalert2`

### Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| `@vitejs/plugin-react` | `^6.0.3` | React support for Vite |
| oxlint | `^1.71.0` | Linting (`npm run lint`) |
| firebase-admin | `^14.2.0` (dev) | Administrative account provisioning script; not a browser dependency |

---

## 4. Project Structure

Only folders and notable paths that **exist** in the repository:

```
Parish-Connect/
├── docs/
│   └── certificate-templates/     # DOCX design references (not runtime exporters)
├── public/                        # Static public assets
├── scripts/                       # Firebase Admin SDK account provisioning
├── tests/                         # Isolated archive service and Chrome UI regression tests
├── src/
│   ├── assets/                    # Logos, certificate assets, fonts
│   ├── components/                # Shared UI, forms, certificates, dialogs
│   │   ├── certificates/
│   │   ├── dialogs/
│   │   └── recordUi/
│   ├── constants/                 # Collections, statuses, report types, etc.
│   ├── contexts/                  # Auth + unsaved-changes providers
│   ├── firebase/                  # Firebase app initialization
│   ├── hooks/                     # e.g. useUnsavedChanges
│   ├── layouts/                   # AdminLayout (sidebar / app bar)
│   ├── pages/                     # Route-level screens
│   ├── reports/                   # Unified report document helpers
│   ├── routes/                    # ProtectedRoute
│   ├── services/                  # Firestore / Auth / PDF services
│   ├── theme/                     # Parish MUI theme
│   └── utils/                     # Validation, dates, places, calendar helpers
├── firebase.json
├── firestore.rules
├── storage.rules
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── QUICK_USER_GUIDE.md
└── SYSTEM_DOCUMENTATION.md
```

There is **no** top-level `certificate-templates/` folder. Certificate DOCX references live under `docs/certificate-templates/`. The Archive page is `src/pages/ArchivedRecords.jsx`, supported by `src/services/archiveService.js` and `src/components/PasswordVerificationDialog.jsx`. There is no Audit Logs page. `.env.example`, `.gitignore`, and `.oxlintrc.json` also exist; local `dist/`, `node_modules/`, `.env`, and `secrets/` are ignored artifacts/configuration, not application modules.

---

## 5. Application Routes

Defined in `src/App.jsx`. All page components load via `React.lazy` and `Suspense`.

| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/unauthorized` | Unauthorized | Public route used for disallowed role/status redirects |
| `/` | Dashboard (includes calendar) | Admin, Staff |
| `/records/baptism` | Baptism Records | Admin, Staff |
| `/records/confirmation` | Confirmation Records | Admin, Staff |
| `/records/marriage` | Marriage Records | Admin, Staff |
| `/records/death` | Death Records | Admin, Staff |
| `/records/conversion` | Conversion Records | Admin, Staff |
| `/records/archived` | Archived Records | Admin, Staff; current-password verification before archive queries/display |
| `/mass-intentions` | Mass Intentions | Admin, Staff |
| `/ministers` | Manage Ministers | Admin, Staff |
| `/maintenance/ministers` | Redirect → `/ministers` | Admin, Staff |
| `/reports` | Reports | Admin, Staff |
| `/profile` | Profile | Admin, Staff |
| `*` (protected shell) | Not Found | Admin, Staff |

Protected routes require Firebase sign-in, a valid `users/{uid}` profile with role `admin` or `staff`, and an active account status when `status` is set.

---

## 6. Authentication

### Module purpose

Control who can access Parish Connect and what they can do, using Firebase Authentication plus a Firestore user profile.

### Main features

- Email and password sign-in
- Password change through Profile. A reset-email helper wraps `sendPasswordResetEmail`, but no Forgot Password UI or caller is implemented.
- Role-based access: **Administrator** (`admin`) and **Staff** (`staff`)
- Firestore role alias: `administrator` is normalized to `admin`
- Session awareness via `onAuthStateChanged`
- Current-password verification for sacramental edit, Move to Trash (also requires Archive Reason), and Archived Records access. Recover within the authenticated archive visit requires confirmation + Recovery Reason without another password; see §20 and §28.
- `lastLogin` updated after the profile is fully loaded
- Disallowed roles or inactive status redirect to `/unauthorized`. A missing profile/role raises a profile-load error and shows the account-verification Retry screen.

### User workflow

1. Staff opens `/login` and enters email and password.
2. Firebase authenticates the account.
3. The app loads `users/{uid}` and resolves role and status.
4. On success, the user lands on the Dashboard (`/`).
5. Logout clears the session and returns the user to login.

### Business rules

- Only users with roles allowed by `ProtectedRoute` (`admin`, `staff`) may enter the admin shell.
- If the profile cannot be loaded, the route shows a retry experience rather than a blank screen.
- Users cannot elevate their own role through the profile self-update path.

### Validation rules

- Login requires email and password (form-level validation on the Login page).
- Login uses required email/password inputs and Firebase Auth error handling. The unused reset helper forwards its email argument to Firebase; there is no local reset-form validation.

### Important notes

- Authentication is **Firebase Authentication**, not a custom password table.
- Authorization is enforced in the UI **and** in `firestore.rules` for signed-in active staff/admin.

---

## 7. Dashboard

### Module purpose

Give parish staff a daily overview of sacramental activity and Mass intentions, together with the interactive parish calendar.

### Main features

- Summary counts for sacramental records and Mass intention activity
- Today’s scheduled Mass intention information (from Mass Intention dashboard stats)
- Monthly parish calendar with color-coded events
- Upcoming events list
- Quick creation of sacramental records and manual calendar events (via calendar interactions)

### User workflow

1. After login, staff arrive on `/`.
2. They review summary cards and the current calendar month.
3. They select dates, open scheduled items, or create new records/events (see Calendar Management).

### Business rules

- Dashboard data is loaded from Firestore through dedicated services (`dashboardService`, event service, sacramental services, Mass intention stats).
- Sacramental and Mass Intention markers and manual events are stored in `events`. Record create/update attempts to sync linked events after saving; sync failures are logged without rolling back the record.
- Dashboard and Reports sacramental totals subtract documents with `archived == true` from total counts. Missing archive flags remain included. Count-read failures return zero, so a zero card can also represent a failed request. Recovery sets `archived: false`, restoring inclusion on the next Dashboard/Reports count load; these screens are not live subscriptions.

### Validation rules

- Opening calendar creation on past dates is blocked; an open manual form does not revalidate a changed date against today (§8).
- Event and record forms apply their own module validation when opened from the Dashboard.

### Important notes

- There is **no separate `/calendar` route**. Calendar Management is part of the Dashboard page.

---

## 8. Calendar Management

### Module purpose

Schedule and review parish activity by date: sacramental celebrations, Mass intentions (as calendar markers when synced), and manual parish events.

### Main features

- Month grid with navigation
- Color coding by source
- Single-click date selection
- Double-click create / overview flows
- “Scheduled on this Date” overview for days that already have events
- “Create New Record” sacrament chooser
- Manual calendar event add / edit / view / delete
- Past-date protection

### Calendar color coding

| Source | Color |
|--------|-------|
| Baptism | Blue (`#1565C0`) |
| Confirmation | Green (`#2E7D32`) |
| Marriage | Purple (`#6A1B9A`) |
| Death | Gray (`#616161`) |
| Conversion | Orange (`#EF6C00`) |
| Mass Intention | Teal (`#00838F`) |
| Manual calendar event | Marian blue (`#0B3D91`) |

### User workflow

#### Single-click

- Selects the date in the calendar and day panel.
- Does **not** open a create dialog by itself.
- Helper text in the UI: *Single-click to view · Double-click to create a record*.

#### Double-click

1. If the date is **before today** → show message: past dates cannot receive new records; no create dialog.
2. If the date is **today or future** and already has events → open **Scheduled on this Date** overview:
   - Lists sacramental records and calendar events for that day (clickable)
   - Quick actions:
     - **Add Sacramental Record** → opens Create New Record chooser
     - **Add Calendar Event** → opens Add Event dialog
3. If the date is **today or future** and empty → open **Create New Record** directly.

#### Create New Record options

- Baptism
- Confirmation
- Marriage
- Death Record
- Conversion

Select a record type and a required schedule time before Continue. Changing the type clears the selected time. Baptism, Confirmation, Marriage, and Death **New Record** forms receive the calendar date and time. Conversion receives the date only; its service fixes the linked event at **08:00**, regardless of the chooser time. These are `recordType: 'new'` records.

Baptism, Confirmation, Marriage, and Death forms no longer expose a time selector. Their create paths receive the calendar time, and updates preserve the stored time. Linked events remain view-only from the calendar.

#### Manual calendar events

Titles include Batch Baptism, Holy Mass, Parish Meeting, Seminar, Fiesta, Novena, Procession, Wedding Rehearsal, Funeral Service, and Others (custom title required when Others is selected).

Manual events require **Start Time** and **End Time**, with the end later than the start on the same date. Create and update check for overlapping manual events on that date, excluding the event being edited. Adjacent ranges such as 09:00–10:00 and 10:00–11:00 are allowed. Conflict messages identify the existing event and its time range.

Sacramental events are excluded from this overlap check. Legacy events with only `time` can still display, but do not participate in range conflict detection until both range fields exist. Editing a legacy manual event requires supplying an end time.

### Business rules

| Rule | Behavior |
|------|----------|
| Today | Editable for create/update of allowed items |
| Future dates | Editable |
| Past dates | Calendar create entry points are blocked with a past-date message; the manual form's editable date is not checked again on save |
| Past **manual** events | Open in **view** mode |
| Sacramental-linked events | Not edited/deleted from the calendar; staff must edit the original sacramental / Mass Intention record |
| Multiple records same date | Supported; overview lists all items for that day |

### Validation rules

- Past date key: `dateKey < today` (local calendar day).
- Manual event forms validate required event fields and custom title when needed.
- Manual Date remains editable. Once a form is opened on an allowed date, changing it to a past date is not rejected by form/service validation. Existing past events still open locked; this does not guarantee all newly submitted dates are non-past.
- New sacramental forms enforce today-or-future sacrament/burial/reception dates as applicable.

### Important notes

- Sacramental events on the calendar are **read-only projections**; editing happens in the sacramental module or Mass Intentions module.
- Mass Intentions are typically managed under `/mass-intentions`; they appear on the calendar when synced as events with source `massIntention`.
- Double-clicking a non-past date with events opens the overview; the separate Add Event action can open the manual form directly.
- `getEvents()` reads linked parents for the five sacraments and hides events whose parent has `archived === true`. The stored event is retained; a missing parent is not automatically suppressed. These reads occur on load/refresh, not through live Firestore subscriptions. Recovery reveals retained linked events on the next load without recreating, rescheduling, or synchronizing them; independently missing events are not rebuilt.

---

## 9. Baptism Records

### Module purpose

Encode, search, view, and update baptismal register entries; generate Baptism certificates.

### Main features

- List, search, and filter baptism records
- Add/edit via **Old Record** forms on the Baptism page (historical encoding)
- **New Record** forms from the Dashboard calendar (scheduled/upcoming baptisms)
- Documentary requirements checklist (Birth Certificate)
- Certificate generation for saved records
- View dialog with full details

### User workflow

1. Open **Baptismal Records**.
2. Search or filter the table.
3. View a record, or open Add/Edit for old (historical) encoding.
4. For upcoming baptisms, create from the Dashboard calendar as a New Record.
5. Generate certificate from the record view / form actions when the record is saved.

### Business rules

- **New records:** sacrament date must be today or future; record number/year are auto-assigned on save.
- **Old records:** sacrament date must be in the past; staff enter record year and number manually.
- Creation sets status to Scheduled. The Baptism form no longer exposes a status selector; updates preserve existing status and time.
- Requirements checklist never blocks save.
- Creating/updating a baptism syncs a related calendar event.

### Validation rules

- Required child, parent, minister, date, and place fields as enforced by the form
- Birth date cannot be after baptism date
- Godparent name validation
- Duplicate check on record year + record number
- Proper Case applied to person names on save
- Place of birth / residence completeness where required

### Important notes

- Certificate type: **Baptism** — implemented.
- Requirements key: `birthCertificate`.
- Old-record and edit forms include optional `bookNumber` (Roman numeral), `lineNumber`, and `pageNumber` (positive integers). Line and page displays pad to at least two and three digits respectively. Record number and year can be corrected during editing, subject to duplicate checks.
- Godparents now capture residence instead of asking for gender. Existing gender values are retained for compatibility.
- The Birth Certificate checklist includes `birthCertificateRegistryNumber`, defaulting to `N/A` when blank.
- Edit requires the current account password. **Move to Trash** requires password + Archive Reason, retaining the source document and linked event. The Baptism tab in password-gated Archived Records supports recovery with identity confirmation + Recovery Reason (section 20).
- Clearing an existing book/line/page field in the Baptism edit form does not remove it: blank optional values are omitted from the update payload.

---

## 10. Confirmation Records

### Module purpose

Manage confirmation register entries and generate Confirmation certificates.

### Main features

- List / search / filter
- Old-record encoding on the Confirmation page; New-record scheduling from calendar
- Requirements checklist (Baptismal Certificate)
- Sponsors (male and female), including residence fields
- Baptism parish name, place of baptism, parents' residence, and book / line / page references
- Certificate generation

### User workflow

Same pattern as Baptism: list → view/edit historical records; schedule new confirmations from the calendar; generate certificate when needed.

### Business rules

- New vs Old date rules apply to confirmation date.
- Requirements checklist does not block save.
- Calendar sync on create/update.
- Service-level create status uses the shared active/status conventions in code (`active` on create in the confirmation service path).

### Validation rules

- Required confirmand and related fields
- New/old confirmation date rules
- Duplicate year + number
- Proper Case names
- Manually entered age is required and must be a whole number of at least 13 (form and service validation).
- Baptism parish name and place of baptism are required in the form.
- Optional book number must be a Roman numeral; optional line and page numbers must be positive integers.

### Important notes

- Certificate type: **Confirmation** — implemented.
- Requirements key: `baptismalCertificate`.
- The checklist captures the baptismal certificate's book, line, page, and year in `baptismalCertificateBookNumber`, `baptismalCertificateLineNumber`, `baptismalCertificatePageNumber`, and `baptismalCertificateRecordYear`; blank values become `N/A`.
- The form uses entered age rather than a birth-date input. Existing birth dates are preserved when omitted during updates; new records may have no birth date, leaving that certificate line blank.
- Record **year** and book/line/page references are editable; the Confirmation record **number** is disabled during editing. Time is supplied when scheduling and preserved on update.
- Edit requires the current account password. **Move to Trash** requires password + Archive Reason, retaining the source document and linked event. The Confirmation tab in password-gated Archived Records supports recovery with identity confirmation + Recovery Reason (section 20).
- Confirmation create/update records timestamps but does not populate creator/updater identity in its service.

---

## 11. Marriage Records

### Module purpose

Manage marriage register entries (groom, bride, sponsors, documentary requirements) and generate Marriage certificates.

### Main features

- Full groom and bride biographical blocks
- Principal sponsors
- Nationality (default Filipino), occupation, civil status options
- Requirements checklist (six documentary items)
- Certificate generation
- Audit log entries on create/update

### User workflow

List → view / add / edit; schedule new marriages from calendar; generate certificate from a saved record.

### Business rules

- New vs Old marriage date rules
- Requirements never block save
- Calendar event sync
- Audit actions: `Created Marriage Record`, `Updated Marriage Record`

### Validation rules

- Required marriage date, minister, spouses, and related fields
- Spouse birth dates must not follow the marriage date. Ages are computed from birth date and marriage date and shown as disabled fields; service validation accepts non-negative whole numbers rather than enforcing a minimum marriage age.
- Duplicate record numbering
- Proper Case names
- Place completeness for residences / places of birth as required by the form

### Documentary requirements

- Birth Certificate
- Baptismal Certificate
- Confirmation Certificate
- CENOMAR
- Marriage License
- Marriage Banns

### Important notes

- Certificate type: **Marriage** — implemented.
- Civil status options include Single, Widow, Widower, Annulled, Unknown (as defined in marriage option constants).
- Edit requires current-password verification; **Move to Trash** additionally requires an Archive Reason. Trash retains the source and linked event. The Marriage tab in password-gated Archived Records supports confirmation-and-reason recovery (section 20). Record number/year are disabled in the edit form; saved time is preserved.

---

## 12. Death Records

### Module purpose

Manage burial / death register entries and generate Death certificates.

### Main features

- Deceased identity, civil status categories, related person, residence
- Date of death, burial date, place of burial
- Last sacraments received indicator
- Requirements checklist (Death Certificate)
- Certificate generation

### User workflow

List → view / encode old records; schedule burial-related new records from calendar; generate certificate when appropriate.

### Business rules

- New records focus on burial scheduling for today/future (calendar New Record path).
- Old-record creation requires a past **date of death**. It checks burial ≥ death, but does not require the burial date itself to be in the past.
- Burial date cannot be earlier than date of death.
- Requirements checklist does not block save.
- Calendar sync uses burial scheduling conventions in the death service.

### Validation rules

- Burial ≥ death
- Birth date is required and must not follow date of death; age is computed from birth/death dates, with non-negative whole-number validation
- Duplicate year + number
- Proper Case names
- New burial must be today/future; old date of death must be past (no separate old burial past-date check)

### Important notes

- Certificate type: **Death** — implemented.
- Requirements key: `deathCertificate`.
- Minister assignment filter for death uses the **Burial** assignment in Manage Ministers.
- Edit requires current-password verification; **Move to Trash** additionally requires an Archive Reason. Trash retains the source and linked event. The Death tab in password-gated Archived Records supports confirmation-and-reason recovery (section 20). Record number/year are disabled in the edit form; saved time is preserved.
- Death `status` represents civil status, not a sacramental completion lifecycle. The boolean `archived` flag is separate.

---

## 13. Conversion Records

### Module purpose

Manage reception / conversion register entries (convert, parents, original baptism details, receiving minister).

### Main features

- List / search / filter
- Old and New record forms
- Requirements checklist (Birth Certificate, Baptismal Certificate)
- View dialog

### User workflow

Encode conversions from the Conversion page or schedule New Records from the calendar.

### Business rules

- New vs Old date rules for date of reception
- Requirements never block save
- Calendar sync on create/update

### Validation rules

- Required convert identity and reception fields as enforced by the form
- Required parent names, receiving minister, original baptism denomination/place, and residence; the original baptism date is optional in the current form
- Duplicate year + number
- Proper Case names
- Residence place completeness where required

### Important notes

- **Conversion certificate generation is implemented**, including preview, editable Purpose, native print, and PDF through the shared certificate layout (§17).
- Edit requires current-password verification; **Move to Trash** additionally requires an Archive Reason. The source and linked event are retained; record number/year are disabled on edit. The Conversion tab in password-gated Archived Records supports confirmation-and-reason recovery (section 20).
- Linked Conversion events always use **08:00**; the chooser time is not saved by the Conversion form/service.
- Requirements keys: `birthCertificate`, `baptismalCertificate`.

---

## 14. Mass Intentions

### Module purpose

Record Mass intentions requested by parishioners, schedule them, mark them as offered after celebration, or cancel them with an optional reason.

### Main features

- Intention numbering (year + sequence)
- Intention types and recipient (“Offered For”) models
- Celebrant selection
- Status workflow with confirmation dialogs
- Read-only protection after completion/cancellation
- Search and filters
- View dialog (including cancellation reason when present)

### Statuses (exact labels)

| Status | Meaning |
|--------|---------|
| **Pending** | Request received; not yet scheduled |
| **Scheduled** | Assigned to a Mass date/time |
| **Offered** | Mass has been celebrated for this intention |
| **Cancelled** | Intention will not be offered |

Default on create: **Pending**, but the form allows selecting any of the four statuses before saving. Mass date/time are required even for Pending records.

### Intention types

Soul of the Deceased, Thanksgiving, Healing, Birthday, Wedding Anniversary, Death Anniversary, Special Intention, Others.

### Recipient types

Individual, Couple, Family, Organization / Ministry, Others — with business rules limiting which recipient types are allowed for each intention type.

### User workflow

1. Staff create an intention (Pending) from Mass Intentions (or related Dashboard path when used).
2. Staff move **Pending → Scheduled** when a Mass date/time is set (**no confirmation dialog**).
3. After the Mass:
   - **Scheduled → Offered** opens **Mark as Offered** confirmation.
   - Confirming updates the status; after save, the record becomes read-only.
4. To cancel a scheduled intention:
   - **Scheduled → Cancelled** opens **Cancel Mass Intention**.
   - Optional **Cancellation Reason** may be entered and stored.
   - After save, the record becomes read-only.

### Confirmation dialogs

**Mark as Offered**

- Title: Mark as Offered
- Confirms the Mass has already been celebrated
- Warns that the record will become read-only
- Buttons: Cancel | Mark as Offered

**Cancel Mass Intention**

- Title: Cancel Mass Intention
- Optional multiline Cancellation Reason
- Buttons: Back | Confirm Cancellation

### Business rules

- Only **Scheduled → Offered** and **Scheduled → Cancelled** require confirmation.
- When status is **Offered** or **Cancelled**:
  - Form fields are read-only
  - Save is hidden
  - List Edit/Delete actions are disabled
  - Service layer rejects update/delete with a locked-record error
- Sacramental records (Baptism, Confirmation, Marriage, Death, Conversion) are **not** locked by this workflow. They remain editable so authorized staff can correct clerical or encoding mistakes.

### Validation rules

- Required Mass date/time, intention/recipient information, celebrant, requester, and residence fields as enforced by the form
- Contact number is optional; when entered, phone validation requires 11 digits
- Intention-type / recipient-type consistency
- Proper Case on names

### Important notes

- This completion workflow is **Mass Intention–only**.
- It is not a strict transition state machine: all four status choices remain available for unlocked forms; only transitions from the current form value Scheduled to Offered/Cancelled open confirmations. The service validates allowed status labels and the previous record lock, not the transition sequence.
- Create/update syncs an event regardless of status, so Pending, Offered, and Cancelled intentions are not automatically excluded from the calendar.
- Unlocked Mass Intention deletion is still permanent, with best-effort linked-event deletion. It does not use sacramental Trash/Archive.
- Page size constant: 10 records per page in the Mass Intentions list.

---

## 15. Ministers Management

### Module purpose

Maintain the roster of clergy and religious who can be assigned to sacraments and Mass intentions.

### Main features

- Add / edit / view ministers
- Search and filter
- Assignment to sacrament areas
- Title and position pairing rules
- Active / Retired / Inactive status

### Assignments

Baptism, Confirmation, Marriage, Burial, Conversion.

### Titles and positions

Titles include Rev. Fr., Fr., Bishop, Archbishop, Msgr., Rev., Deacon, Bro., Sister. Positions are constrained by title (for example Parish Priest, Assistant Parish Priest, Parochial Vicar, Visiting Priest, Bishop, Archbishop, Deacon, Religious Brother, Religious Sister, Seminarian).

### User workflow

1. Open **Manage Ministers**.
2. Add a minister with name, title, position, contact details, assignments, and status.
3. Sacramental forms load **Active** ministers filtered by assignment. The Mass Intention celebrant field loads Active ministers without an assignment filter.

### Business rules

- Roster choices include only **Active** ministers. `MinisterField` also exposes an **Other** free-name entry, including on create; services store the name and do not validate roster membership/status.
- Historical names already saved on a record can still be retained via an “Other” / free-name path so edits do not break.
- Legacy `archived` status normalizes to **Inactive**.

### Validation rules

- Required identity fields
- Valid title–position combination
- Optional email format validation
- Phone validation when provided
- Proper Case names

### Important notes

- Route `/maintenance/ministers` redirects to `/ministers`.

---

## 16. Reports

### Module purpose

Generate filtered sacramental and Mass Intention reports for parish office use, preview them, print them, and export PDF files.

### Main features

- Report type selection
- Year / month (and related) filters as required by type
- Minister filter where applicable
- Summary counts
- Preview dialog
- Export PDF and Print
- Recent reports list (metadata in Firestore `reports`) with ability to reopen

### Report types (implemented)

| Value | Label |
|-------|-------|
| `baptism` | Baptism |
| `confirmation` | Confirmation |
| `marriage` | Marriage |
| `death` | Death |
| `conversion` | Conversion |
| `massIntention` | Monthly Mass Intentions |
| `massIntentionDaily` | Daily Mass Intentions |
| `massIntentionWeekly` | Weekly Mass Intentions |
| `massIntentionPending` | Pending Intentions |
| `massIntentionScheduled` | Scheduled Intentions |
| `massIntentionOffered` | Offered Intentions |

Parish identity on report headers:

- **Immaculate Conception of the Virgin Mary Parish**
- **Bani, Pangasinan**

### User workflow

1. Open **Reports**.
2. Choose a report type, year or **All Years**, and month or **All Months**. Explicitly select a minister or **All Ministers**, then Generate.
3. Review Preview.
4. Print or Export PDF.
5. Optionally reopen from Recent Reports.

### Business rules

- Successful PDF export calls `saveReportMetadata` to store filters, title, filename, counts, and generation identity/time in `reports`. Generate and Print alone do not create history entries. No row snapshot or exported file is stored; reopening regenerates from current records, so edits, archiving, and recovery can change results. Existing downloaded files and saved report metadata are not rewritten.
- Export format recorded as PDF when exporting from the preview workflow.
- Recent reports are ordered by creation time; `getRecentReports` defaults to 25 metadata entries. Metadata-write failure returns `null` and does not block the PDF download.
- The year selector defaults to **All Years** and loads distinct stored `recordYear` values for the selected collection, newest first. A predefined year list is used if loading fails.
- Changing report type resets year, month, and minister selections. Summary cards show all-time totals independently of the selected report filters.
- **All Years** reads the selected collection; a specific year queries numeric `recordYear` (not the year of the sacrament date). Month uses the configured sacrament/Mass date and minister matching is an exact case-insensitive name match. Legacy string-valued years do not match a numeric year query.
- Rows and available-year discovery exclude `archived === true`; summary counts also exclude archived sacramental records. Recovery restores eligibility under existing year/month/minister/status filters on reload/regeneration. Already-generated report previews remain in-memory datasets.
- Daily and Weekly Mass Intention report labels currently use the same year/month filtering as Monthly. There is no selected day or week range. Pending/Scheduled/Offered report types add their respective status filter.
- **Recent Reports limitation:** saved `All Ministers` is passed literally into the minister matcher when reopened, which normally yields no rows. If reopening changes the report type, the type-change effect also resets visible filters; the generated preview still uses the passed filters.
- Minister choices list Active assigned ministers (all Active ministers for Mass Intentions). Retired/inactive/free-text historical names remain reportable under All Ministers but may not have an individual selector option.

### Validation rules

- Report type and a valid year or **All Years** are required. The page requires an explicit minister choice, including **All Ministers**, for a new report; reopening saved reports uses their stored filters.

### Important notes

- PDF export uses **jsPDF** + **AutoTable** on Letter paper; more than four columns selects landscape (all current report types have more than four).
- Empty reports can be previewed, but Print and PDF export are disabled when there are no rows.
- Print uses the browser print dialog on the preview content.

---

## 17. Certificate Generation

### Module purpose

Produce official-looking parish certificates from saved sacramental records for printing or PDF download.

### Supported certificate types (runtime)

| Sacrament | Status |
|-----------|--------|
| Baptism | ✔ Implemented |
| Confirmation | ✔ Implemented |
| Marriage | ✔ Implemented |
| Death | ✔ Implemented |
| Conversion | ✔ Implemented through shared layout |

### How generation works (actual implementation)

1. Staff click **Generate … Certificate** on a saved record (record details dialog or edit form actions via `CertificatePrepActions`).
2. The app opens **Certificate Preview** (`CertificatePreviewDialog`).
3. The app loads the Firestore record and maps fields into certificate view data (`buildCertificateData` in `certificateService.js`).
4. `CertificatePreviewDialog` renders **`BaptismCertificate` for all five types**, with sacrament-specific data, titles, rite text, and detail rows. `CertificateLayout` and `certificateShared` provide the common layout, logos, footer, and signature. Separate `ConfirmationCertificate`, `MarriageCertificate`, and `DeathCertificate` files exist but are not used by this preview path.
5. **Print:** `react-to-print` clones the rendered certificate into its print iframe. The custom print callback waits for fonts, measures the page under print geometry, and scales the whole certificate to fit a 210 × 296 mm sheet within A4, allowing pagination rounding. It calls the iframe window’s native print dialog without opening a popup tab.
6. **Download PDF:** `html2canvas` captures the certificate element; **jsPDF** builds an A4 PDF for download.

This is **dynamic field mapping into HTML certificate components**, not a Word mail-merge engine running inside the browser.

### DOCX templates

Located at:

`docs/certificate-templates/`

| File | Purpose |
|------|---------|
| `baptismal-cert_docx.docx` | Baptism design reference |
| `Confirmation-Certificate.docx` | Confirmation design reference |
| `CERTIFICATE-OF-MARRIAGE.docx` | Marriage design reference |
| `death-cert_docx.docx` | Death design reference |

These DOCX files guide visual/content alignment. **The application does not currently generate `.docx` files at runtime.**

### Certificate identity constants

- Diocese: The Roman Catholic Diocese of Alaminos
- Parish name / address constants used on certificates (see `src/constants/certificates.js`)
- Assets under `src/assets/certificates/` (logos, seal, fonts)
- Header and attestation use **Immaculate Conception of the Virgin Mary Parish**; the address is **2407 Bani, Pangasinan**.
- The shared runtime displays **Minister** (Conversion: **Receiving Minister**). Confirmation shows the mapped minister name without adding “Reverend Father”; the other mappings add that phrase. Leading clerical titles are stripped by the mapper where recognized.
- All five runtime signatures leave the name blank and use **Parish Priest**. The **Parish Priest / Parochial Vicar** label belongs to the unused dedicated Confirmation component.
- The active stylesheet requests Cinzel and Cormorant Garamond from Google Fonts, with Times New Roman/serif fallbacks. Bundled legacy font assets do not determine the shared layout’s active typefaces.

### Certificate Preview

- Dialog title: **Certificate Preview**
- Shows loading state while record data is mapped
- Renders the full official certificate layout for review before print/PDF
- Editable multiline **Purpose** is included in the rendered certificate, print, and PDF. Edits exist only in preview state and are not saved to the source record.
- Actions: **Close**, **Print**, **Download PDF**

### Printing

- Triggered from the Print button in Certificate Preview
- Uses `react-to-print` against the preview `ref`
- Opens the browser native Print Preview for the visible certificate
- Certificate CSS (`certificate.css`) uses A4 portrait with zero page margins, an isolated fixed sheet, measured whole-page scaling, and long-text wrapping. These mechanisms are implemented; this audit does not claim successful native Print Preview or physical-printer validation.

### PDF Export

- Triggered from **Download PDF** in Certificate Preview
- Pipeline: wait for fonts/images → rendered certificate DOM → `html2canvas` at scale 2 → PNG → `jsPDF` A4 portrait download. Oversize content is proportionally fitted and centered on one page; it is not split across pages. This is a raster PDF and long content can reduce text size.
- File name pattern includes sacrament prefix and record number/id

### User workflow

1. Save the sacramental record.
2. Click **Generate … Certificate**.
3. Review Certificate Preview.
4. Print (native Print Preview) and/or Download PDF.

### Business rules

- A saved `recordId` is required; the source getters return no record for missing or `archived === true` documents. Recovery restores normal source lookup for the same record ID; it does not generate a certificate or change its content. An already-open preview is an in-memory copy and is not revalidated on Print/PDF.
- All five configured sacraments are supported. Unsupported types or missing IDs disable the shared action; source-load failures show an error.
- Certificate generation does not alter the source sacramental record.

### Important notes

- Certificate Preview is opened from `CertificatePrepActions` on saved records; PDF generation uses `html2canvas` + `jsPDF` only when Download PDF is clicked.
- Route-level pages remain lazy-loaded via `React.lazy` in `App.jsx`.
- Conversion is included in `CERTIFICATE_IMPLEMENTED` and mapped by `buildCertificateData`. Certificate issuance does not create an issuance register, verification token, or stored PDF.

---

## 18. User Profile

### Module purpose

Allow signed-in staff to view account information and update personal profile details and password.

### Main features

- View email, role, status, last login, user id display
- Edit name parts, phone, address, birthday, gender
- Change password
- Quick links (for example Dashboard / Reports) in the profile UI
- Audit entries for profile update and password change

### User workflow

1. Open **Profile**.
2. Update allowed personal fields → Save.
3. Optionally change password through the password form.

### Business rules

- Users cannot change their own role, email, or privilege fields through self-update.
- Password changes go through Firebase Auth (`passwordService`) and update profile metadata such as `lastPasswordChange`.

### Validation rules

- Name validation / Proper Case
- Phone validation when provided
- Password change requires the current password and a matching new-password confirmation. The new password must differ from the current one and contain at least eight characters, uppercase, lowercase, a digit, and a special character.
- First/last name and gender are required; an optional birthday must be valid and not future-dated.

### Important notes

- `photoURL` may display if present on the profile document, but the current app code does **not** implement a Storage upload workflow for profile photos.

---

## 19. Firebase Integration

### Module purpose

Provide authentication, primary database storage, and (prepared) file storage for Parish Connect.

### Services initialized (`src/firebase/config.js`)

| Service | SDK entry | Used by app code |
|---------|-----------|------------------|
| Firebase App | `initializeApp` | Yes |
| Authentication | `getAuth` | Yes |
| Cloud Firestore | `getFirestore` | Yes |
| Cloud Storage | `getStorage` | Initialized/exported; **no feature currently imports `storage` for uploads** |

### Environment variables (`.env.example`)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Data flow (high level)

1. User signs in with Firebase Auth.
2. App reads `users/{uid}` for role and profile.
3. Modules read/write their Firestore collections through `src/services/*`.
4. Sacramental / Mass Intention writes may sync related documents in `events`.
5. Selected modules write `auditLogs`.
6. Reports may write metadata to `reports`.
7. Certificates and report PDFs are generated **in the browser** (not stored as certificate binaries in Storage by the current code).

### Firebase project config files

- `firebase.json` points to `firestore.rules` and `storage.rules`.
- Operational data uses one-shot reads (`getDocs`, `getDoc`, server counts), followed by page reloads after actions. No `onSnapshot` data subscriptions, persistent offline-cache setup, or emulator configuration is present.
- Archive exclusion happens in application reads, not in a separate collection or access rule. Sacramental list/number-allocation helpers scan collections; archived records still incur reads and reserve their registry numbers.

---

## 20. Firestore Collections

Exact collection names from `src/constants/collections.js`:

| Constant | Collection ID | Purpose |
|----------|---------------|---------|
| `USERS` | `users` | User profiles, roles, account status, and personal profile fields keyed by Firebase Auth UID |
| `BAPTISM` | `baptism` | Baptismal register records (new/old workflows, requirements, calendar link) |
| `CONFIRMATION` | `confirmation` | Confirmation register records |
| `MARRIAGE` | `marriage` | Marriage register records (spouses, sponsors, documentary requirements) |
| `DEATH` | `death` | Death / burial register records |
| `CONVERSION` | `conversion` | Conversion / reception into the Church register records |
| `MASS_INTENTIONS` | `massIntentions` | Mass intention requests and status lifecycle |
| `EVENTS` | `events` | Parish calendar events (manual entries + synced sacramental / Mass Intention markers) |
| `MINISTERS` | `ministers` | Minister roster used in sacramental and Mass Intention forms |
| `REPORTS` | `reports` | Report generation metadata (filters/title for recent reports; not a full archive dump) |
| `AUDIT_LOGS` | `auditLogs` | Security / activity audit trail entries (written for selected modules; **no dedicated admin UI page**) |

### Document relationships

- Sacramental / Mass Intention documents may be linked to `events` documents via related-record identifiers and `source` values (`baptism`, `confirmation`, `marriage`, `death`, `conversion`, `massIntention`, `manual`).
- `users/{uid}` documents align with Firebase Auth UIDs.
- Audit logs reference the acting user’s email/UID and module action text.
- Report metadata references filters used to regenerate a preview; it is not a second copy of the entire sacramental archive.

### Trash / Archive storage and compatibility

**Sources:** `src/pages/ArchivedRecords.jsx`, `src/components/PasswordVerificationDialog.jsx`, `src/services/passwordService.js`, `src/services/archiveService.js`, the five sacramental record pages/services, `src/App.jsx`, and `src/layouts/AdminLayout.jsx`.

#### Archived Records access

The shared desktop/mobile sidebar includes **Archived Records** at `/records/archived`. This is an additive Admin/Staff route; the original module routes remain unchanged.

1. Opening the route first shows **Access Archived Records**, asking for the current account password. Before successful verification, only the heading/password dialog is rendered: no archive names, counts, tabs, or record queries. Direct URL entry starts locked; Cancel returns to Dashboard (`/`).
2. `verifyCurrentPassword` uses Firebase `EmailAuthProvider.credential` and `reauthenticateWithCredential`. Incorrect passwords leave the page locked; passwords are not stored in Firestore.
3. Successful verification creates temporary in-memory access for the current Firebase user and page visit. The page is keyed by user UID and router location key, revokes access on unmount, and listens for account changes. Refresh, leaving/re-entry, logout, or changing accounts requires verification again. Unlock state is not persisted in browser storage; there is no timed expiry during an otherwise unchanged visit.
4. After verification, tabs separate **Baptism, Confirmation, Marriage, Death, and Conversion**, initially selecting Baptism. Only the selected collection is queried with `where('archived', '==', true)`; switching tabs mounts/loads that tab again. Records sort by year then record number, descending.
5. Rows show Record Number, Name (both spouses for Marriage), Archived On, Archive Reason, and **Recover**. Missing reasons/dates display **Not recorded**. Empty/failed loads show an empty-state message or Retry action.

#### Archive and recovery workflows

All five record pages use `PasswordVerificationDialog` with `requireReason` for **Move to Trash**: provide **Archive Reason** and **Current Password**, reject blank/whitespace-only reasons, verify the password, then call `archive*Record(id, reason)`. These five wrappers delegate to `archiveRecord(collectionName, id, reason)`. Successful archiving closes the dialog and reloads the active record list.

**Recover** opens a confirmation dialog showing the record identity and requiring **Recovery Reason**. Blank/whitespace-only reasons are rejected in both UI and service. **Confirm Recovery** calls `recoverArchivedRecord(collectionName, id, reason, access)` without a second password prompt. Success removes the row from the archive table and shows a success alert; failure leaves the dialog/reason available with an error.

Both actions use `runTransaction` against the **existing document** in `baptism`, `confirmation`, `marriage`, `death`, or `conversion`. The shared service allowlists these collections, validates ID/reason and the current account, checks document existence, and rejects already-archived/already-recovered states. Recovery also validates the visit's access before and after the transactional read. Reasons are trimmed before storage.

| Field | Archive write | Recovery write |
|-------|---------------|----------------|
| `archived` | `true` | `false` |
| `archivedAt` | `serverTimestamp()` | Preserved |
| `archiveReason` | Required trimmed reason | Preserved |
| `recoveredAt` | Preserved if already present | `serverTimestamp()` |
| `recoveryReason` | Preserved if already present | Required trimmed reason |

There is no `trash` collection, move/copy, permanent deletion, or migration. Each transaction updates only the three fields for its action. It does **not** modify sacramental/civil `status`, registry numbers, ordinary `updatedAt`/`updatedBy` fields, or linked events. Neither action writes actor UID/email fields or an `auditLogs` entry. These fields record the latest respective actions, not complete history: subsequent archives overwrite archive reason/time; subsequent recoveries overwrite recovery reason/time.

- Only the literal boolean `true` hides a record; missing/false flags remain visible. A legacy `status: 'archived'` alone is not the Trash flag.
- Legacy archived documents without `archiveReason`, `recoveryReason`, or recovery timestamps remain recoverable without a backfill.
- Active lists and single-record getters exclude archived records. Calendar loading checks the five sacramental parent collections and suppresses linked events without deleting them. Reports and year discovery filter archived rows; Dashboard/Reports counts subtract archived totals.
- Recovery returns the same document to its correct active module on the next load, subject to existing filters, and restores fresh certificate lookup eligibility. Retained calendar events reappear on reload without recreation/rescheduling; independently missing events are not rebuilt. Reports/year discovery and totals include recovered records on reload/regeneration under existing filters. Already-open screens/previews, other browser tabs, saved metadata, and downloaded files are not automatically rewritten.
- Auto-numbering and duplicate checks include retained records, preventing reuse of their numbers in the ordinary sequential workflow. They are still non-transactional.
- Recovery preserves the original number and document ID. Transactional archive/recovery state updates do not change the existing non-transactional number-allocation logic.
- Sacramental list/by-ID readers assign the real Firestore snapshot ID after stored data, so a legacy stored `id` cannot override the document reference in those paths. This precedence is not universal: event, report-row, and Mass Intention mappings still spread stored data after the snapshot ID.
- There is no purge UI or automatic expiry. Normal edit services do not independently reject an archived ID, and rules still allow staff/admin access to retained documents. The password gate is an application control, not a database read restriction (§28).

### Common audit fields on records

Many operational documents store `createdAt`, `updatedAt`, `createdBy`, and `updatedBy` even when a separate `auditLogs` entry is not written.

### Recent schema additions

| Collection | Fields / behavior |
|------------|-------------------|
| `baptism` | `bookNumber`, `lineNumber`, `pageNumber`, `birthCertificateRegistryNumber`, and residence on godparent objects |
| `confirmation` | `bookNumber`, `lineNumber`, `pageNumber`, `baptismParishName`, `parentsResidence`, `maleSponsorResidence`, `femaleSponsorResidence`, and the four `baptismalCertificate*` references described in §10 |
| Five sacramental collections | `archived`, `archivedAt`, `archiveReason`, `recoveredAt`, `recoveryReason`; additive fields on the original document; missing legacy fields remain compatible |
| `events` | Manual events store `startTime`, `endTime`, and compatibility field `time` (set to start time); older single-time documents remain readable |

These fields are handled by current forms and services. This documentation update does not migrate existing Firestore documents.

---

## 21. Firebase Storage

### Current implementation

- Firebase Storage is initialized in `src/firebase/config.js`.
- `storage.rules` defines access for `profilePhotos/{userId}/{fileName}`:
  - Owner read/write
  - Image types jpeg/png/webp
  - Max size 5 MB

### Actual app usage

**No module under `src/` currently imports the exported `storage` instance to upload or download files.** Profile photo Storage support is prepared at the rules/SDK level but not wired into a user-facing upload feature.

---

## 22. Validation System

### Module purpose

Protect data quality at the form and service layers before Firestore writes.

### Implemented validation categories

#### Required fields

- Each form enforces required sacramental / intention / event / minister / profile fields before save.
- Shared message: “This field is required.”

#### Duplicate checking

- Manual record year + number combinations are checked against existing records (excluding the record being edited). Service checks include archived records even though the form’s active list does not. These are read-before-write checks, not a database uniqueness constraint.
- Mass Intention numbering uses the Mass Intention record-number utilities.

#### Proper Case formatting

- Person names and many proper nouns are normalized with `toProperCase` / related helpers before storage and display.

#### Date validation

- New records: today or future sacrament / relevant scheduling dates
- Old records: past sacrament/reception dates; Death checks past date of death, without a separate past burial-date requirement
- These new/old restrictions apply on form creation. Edit forms pass no workflow date rule, allowing corrections while retaining relevant birth/death/date consistency checks.
- Baptism: birth date ≤ baptism date
- Death: burial date ≥ date of death
- Calendar: past-date create entry points are blocked, but a changed manual-form date is not rechecked on save (§8)

#### Age

- Marriage and Death compute ages from birth and event dates; non-negative whole numbers (including zero) are accepted. No minimum marriage age is enforced by the current form/service validation.
- Confirmation specifically requires a manually entered whole-number age of at least 13.

#### Phone and email

- Phone: exactly 11 digits when provided/required
- Email: optional basic format check (ministers / password flows as applicable)

#### Person name character rules

- Letters, spaces, apostrophes, hyphens, periods; must include at least one letter

#### Philippine places

- Region / province / city / barangay selectors for residences and places of birth
- Completeness checks where a full place is required

#### Confirmation dialogs

- Mass Intention Offered / Cancelled confirmations
- Unsaved changes discard confirmation
- Delete confirmations (for example Mass Intention delete, manual event delete)
- Current-password verification before edit and Move to Trash in all five sacramental record pages; Trash additionally requires a trimmed nonblank Archive Reason
- Archive access requires current-password verification; Recover requires identity confirmation and a trimmed nonblank Recovery Reason

#### Unsaved Changes Warning

- `useUnsavedChanges` + `UnsavedChangesDialog`
- Route-level awareness via `UnsavedChangesContext` in the admin layout
- Warns when closing a dirty form or navigating away with unsaved edits

#### Read-only restrictions

- Mass Intentions in Offered or Cancelled status
- Past manual calendar events (view mode)
- Sacramental-linked calendar events (edit/delete blocked in calendar)

#### Documentary requirements

- Checklist only; incomplete status is visible but **does not block save**. There is no document attachment/upload workflow.

#### Form validation presentation

- Field-level errors and summary listings (`formValidationSummary` / touched + submit-attempted patterns)

---

## 23. Search and Filtering

### Module purpose

Help staff locate records quickly in large registers.

### Typical capabilities (records modules)

- Text search across primary names / numbers
- Multi-select filters (years, statuses, requirements completeness, ministers, dates, places — depending on module)
- Mass Intentions uses a fixed page size of 10 over the loaded data; the five sacramental tables render their filtered lists without server-side pagination
- Empty states when no rows match

### Reports filtering

- Report type, year, month, minister, and Mass Intention status-oriented report types

---

## 24. Printing

### Implemented print paths

| Feature | Mechanism |
|---------|-----------|
| Certificates | All five types use **`react-to-print`**, a cloned iframe, measured scaling, and a 210 × 296 mm print sheet within A4 portrait. Opens the browser native print dialog without popup tabs. |
| Reports | Print from report preview using **`window.print()`** on the preview dialog content, with `no-print` / `@media print` styles |

PDF download is separate from printing: certificates are raster A4 portrait; report PDFs are AutoTable documents on Letter paper with orientation based on column count. Preview content and native print output require browser/printer verification, especially with long text. The presence of fitting code is not proof that every printer setting has been tested.

---

## 25. Audit Information

### Firestore audit trail (`auditLogs`)

Written through `auditLogService` / `createAuditLog`.

**Currently written for:**

| Module | Example actions |
|--------|-----------------|
| Profile | Updated Profile, Changed Password |
| Marriage | Created Marriage Record, Updated Marriage Record |
| Mass Intentions | Created / Updated / Changed Status / Deleted Mass Intention |

Audit write failures are handled so the primary user operation can still succeed.

### Per-document audit fields

Baptism, Marriage, Death, Conversion, Mass Intentions, and Ministers services write actor/timestamp fields on their ordinary save paths. Confirmation writes timestamps but does not populate creator/updater identity. Baptism, Confirmation, Death, and Conversion do not write separate create/update `auditLogs` entries.

All five archive helpers write `archived`, `archivedAt`, and `archiveReason`; recovery writes `archived`, `recoveredAt`, and `recoveryReason`. Neither action identifies the actor, changes ordinary save audit fields, or appends an audit log. Recovery preserves archive metadata. Manual event documents have timestamps but no actor fields in their service payloads.

### View dialogs

Record view dialogs commonly show Created By / Created At / Updated By / Updated At when available.

---

## 26. User Interface

### Module purpose

Provide a consistent parish-office UI for desktop-first use with usable layouts on smaller screens.

### Responsive design

- Material UI responsive Grid / Stack layouts
- Collapsible navigation drawer in `AdminLayout`
- Dialogs that go full-screen on small breakpoints where configured (for example report preview)
- Touch-friendly icon actions in tables
- Primary design target: staff desktop/laptop browser

### Material UI components

Common patterns include AppBar/Drawer navigation, Dialogs, Tables, Forms (TextField, Select, Date controls), Buttons, Alerts, Snackbars, CircularProgress loading indicators, and Chips for status/requirements.

### Dialogs

The admin sidebar and footer open a shared **About** dialog with parish/application information and developer credits. The login page also displays developer credits.

- Record view / add / edit form dialogs per sacrament
- Certificate Preview dialog
- Report Preview dialog
- Calendar date overview and schedule chooser dialogs
- Manual event form dialog
- Mass Intention status confirmation dialogs
- Unsaved-changes confirmation dialog
- Password-verification dialogs for sacramental editing, Move to Trash (with Archive Reason), and Archived Records access
- Five Archived Records tabs and Recover confirmation with required Recovery Reason

### Notifications and loading states

- Snackbar alerts for success, info, and error feedback
- CircularProgress for async loads and exports
- Empty states when lists have no matching rows
- Protected-route profile-load retry UI when the user profile cannot be loaded

### Confirmation dialogs

- Mass Intention **Mark as Offered** / **Cancel Mass Intention**
- Unsaved changes discard confirmation
- Delete confirmations (Mass Intention delete when unlocked; manual calendar event delete)

---

## 27. Error Handling

### Patterns used in the app

- Service functions throw user-facing messages from `MESSAGES` constants
- Field-level `fieldErrors` objects for form re-display after failed saves
- Snackbar alerts for success, info, and error feedback
- Protected route profile-load retry UI
- Certificate loading/print/PDF errors appear in its dialog; report generation/export errors use the Reports page snackbar
- Record/event sync and audit failures can be logged while the primary save succeeds; report metadata writes can fail without blocking PDF download. Dashboard count failures return zero.
- Calendar informational snackbars for locked past dates and sacramental event locks

---

## 28. Security Features

### Authentication requirement

- Firebase Authentication (email/password) is required for the admin shell
- Public routes: `/login` and the unauthorized experience
- Session tracked with `onAuthStateChanged`

### Role-based access control (RBAC)

| Role (Firestore) | Normalized app role | Access |
|----------------|---------------------|--------|
| `admin` or `administrator` | `admin` | Admin shell + admin-only Firestore capabilities (create users, read audit logs) |
| `staff` | `staff` | Admin shell operational modules |

- `ProtectedRoute` / `ProtectedShell` allow only `admin` and `staff`
- Invalid/disallowed role or inactive `status` → `/unauthorized`; missing profile/role → profile-error Retry screen
- Profile load failure → retry UI (not treated as unauthorized)

### Protected routes

All routes under the admin shell (`/`, records, mass intentions, ministers, reports, profile) require a signed-in active user with an allowed role. See §5 Application Routes.

### Application-level controls

- Self-profile updates cannot change role / email / status privileges in UI and rules
- Mass Intention locked records blocked in UI and service layer
- Sacramental calendar events cannot be casually overwritten from the calendar editor
- All five sacramental record pages use `PasswordVerificationDialog` before edit and Move to Trash; Trash enables the required Archive Reason field. Archived Records uses the same dialog before mounting/querying its record list. `verifyCurrentPassword` reauthenticates the signed-in email/password user through Firebase Auth; the supplied password is not stored in Firestore.
- Password verification is a page workflow control. The record services and Firestore rules do not independently require recent reauthentication. The dialog clears the password and disables repeat submission/closing while verification and its callback run. A completed verification callback is ignored if the dialog has unmounted/closed or the Auth user changed.
- Archive access is an in-memory user/visit-scoped object. Reads check it before and after fetching; recovery checks it around the transactional read. Refresh, leaving/re-entry, logout, and account changes require verification again. Direct URL entry starts locked. Recovery needs confirmation + reason, without another password. There is no persistent unlock or timed expiry.
- This gate prevents pre-authentication archive-page queries/display, not all archived-document reads across the app: normal record/numbering loaders scan collections and filter in memory. The access object is client-created, not server-issued proof of reauthentication. Existing Firestore rules still govern direct access.
- Operational rules grant active staff/admin broad read/write, including direct deletion, access to archived documents, and changes to lock/archive fields. They do not enforce record schemas, unique numbering, calendar date/overlap rules, Mass Intention transitions, or archive immutability. Trash retention is an application workflow, not a database prohibition on deletion.

### Firestore Security Rules (`firestore.rules`)

Helpers: signed-in check, document owner, active user, admin (`admin`/`administrator`), staff-or-admin. Rules lowercase roles but do not trim them. Missing, empty, or non-string status is treated as active by the rules; the UI separately normalizes profile strings. Owner profile permissions and Storage ownership checks do not require an active staff/admin role.

| Collection / path | Access |
|-------------------|--------|
| `users/{userId}` | **Read:** owner or admin. **Create:** admin only. **Update:** admin (full) **or** owner with allowlisted personal/system keys only (`firstName`, `middleName`, `lastName`, `phone`, `address`, `birthday`, `gender`, `photoURL`, `updatedAt`, `updatedBy`, `lastLogin`, `lastPasswordChange`) and immutable `role` / `email` / `status` on self-update. **Delete:** denied. |
| `auditLogs/{logId}` | **Read:** admin. **Create:** staff/admin with required fields and `performedByUid == auth.uid`. **Update/Delete:** denied. |
| Operational collections | Active staff/admin read/write: `baptism`, `confirmation`, `marriage`, `death`, `conversion`, `massIntentions`, `events`, `ministers`, `reports` |

### Storage Security Rules (`storage.rules`)

Path: `profilePhotos/{userId}/{fileName}`

- Owner may read / create / update / delete
- Content type: jpeg, png, or webp
- Max size: 5 MB

### Important note for thesis / deployment

Rules files exist in the project and are referenced by `firebase.json`. They must be **deployed** to the Firebase project (`firebase deploy --only firestore:rules,storage`) to enforce in production. The application code alone is not a substitute for deployed rules.

---

## 29. Production Optimizations

Implemented without changing business behavior:

- Route-level `React.lazy` / `Suspense` for all major pages
- Dialog-level lazy loading for heavy forms and report preview where implemented in page modules
- Vite / Rolldown code-splitting groups for React, MUI, Firebase, Philippine places data, jsPDF, and html2canvas
- Certificate PDF / print libraries load with certificate or report workflows rather than every initial route
- Philippine place dataset loads with place-enabled forms rather than every initial route

---

## 30. Business Rules

The following rules are enforced in the current codebase (UI and/or service and/or security rules):

### Record updates and deletion

1. All five registers require current-password verification for edit and **Move to Trash**; Trash also requires a trimmed nonblank Archive Reason. Archive transactionally sets `archived: true`, `archivedAt`, and `archiveReason` on the original document. **Archived Records** requires verification for each visit before loading/displaying its five tabs. **Recover** requires identity confirmation + trimmed nonblank Recovery Reason, then transactionally sets `archived: false`, `recoveredAt`, and `recoveryReason` without a second password. Recovery preserves archive metadata, status, registry number/ID, and linked events. Missing legacy metadata does not block recovery. No purge UI exists. See sections 20 and 28 for compatibility, reload behavior, and enforcement limits.
2. Ministers have **no delete** path in v1.0; status may be Active / Retired / Inactive.
3. Certificate generation requires an existing saved record (`recordId`) and does not modify the source record.

### Calendar

4. Calendar creation entry points block past dates (`dateKey < today`, local date) in Dashboard. An already-open manual form allows changing Date to a past date; neither save validation nor Firestore rules enforce that date restriction.
5. Days that already have events open a **date overview / preview** before adding another sacramental record or manual event.
6. Multiple events per day are supported.
7. Sacramental-linked calendar events are **view-only** from the calendar; edits happen in the source module.
8. Past **manual** events open in view mode; manual events may be deleted when allowed by UI rules.
9. Calendar “Create New Record” options: Baptism, Confirmation, Marriage, Death Record, Conversion (Mass Intention is **not** listed in that chooser).

Manual events require a same-day start/end range and reject overlaps with other manual ranges. These client-service checks are separate reads and writes, not transactional reservations.

### Mass Intentions

10. Intended status workflow: Pending → Scheduled → Offered or Cancelled. The unlocked form permits other status selections; the service does not enforce a strict transition graph.
11. **Offered** and **Cancelled** intentions are **read-only** (UI + service reject update/delete).
12. Delete is allowed only when the intention is **not** locked.
13. Changing the current form value from Scheduled to Offered / Cancelled opens confirmation dialogs (Cancel may store an optional reason); other selections do not trigger these confirmations.

### Numbering and formatting

14. Record numbers use sacrament-specific prefixes and year + sequence (see Appendix A); duplicates of year + number are blocked for manual/old encoding.
    Service checks also reserve archived numbers. Old/new form date rules apply during creation, with the Death exception in §12; edit forms allow date corrections. These restrictions are not database constraints.
15. Person names are stored in **Proper Case**.
16. Phone numbers (when validated) must be exactly **11 digits**.

### Authentication and profiles

17. Only `admin` / `staff` (active) may use the admin shell.
18. Users cannot elevate their own role or change email/status through self-service profile update (UI + Firestore rules).
19. Requirements checklists are informational and **do not block** sacramental saves.

### Reports and certificates

20. Reports store metadata for regeneration; they are not a second full archive of every row.
21. All five sacramental certificate types, including Conversion, generate from saved non-archived records through the shared layout. Purpose edits are preview-only. There is no completed-status or requirements-completeness gate for generation.

---

## 31. Deployment

### Architecture

| Layer | Platform |
|-------|----------|
| Source control | Git + GitHub |
| Frontend hosting | Vercel (SPA) |
| Backend services | Firebase (Authentication, Firestore, Storage) |
| Security rules | Deployed via Firebase CLI from `firestore.rules` / `storage.rules` |

### Environment variables

Defined in `.env.example` and read via `import.meta.env` for the Vite build/dev server:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Configure the same variables in the Vercel project settings before production builds; changes require rebuilding the frontend. These client configuration values are bundled into the app; Admin SDK service-account credentials belong only to the separate provisioning environment.

### Production build

```bash
npm ci
npm run build
```

- Output: Vite `dist/` directory
- Local preview: `npm run preview`
- Development: `npm run dev`

### Vercel

- `vercel.json` rewrites all paths to `/index.html` so React Router deep links work.
- Connect the GitHub repository to Vercel, select the `Parish-Connect` application directory if deploying from the parent workspace, and configure `npm run build` with output `dist`. The repository rewrite file does not verify a live Vercel project or production deployment.

### Firebase

```bash
firebase deploy --only firestore:rules,storage
```

- `firebase.json` references `firestore.rules` and `storage.rules` (no Firebase Hosting block is required when Vercel hosts the SPA).
- Select the intended Firebase project in the CLI (or pass `--project <project-id>`); no project alias file is present in this repository. Enable email/password authentication and configure the deployed domain in the Firebase project.
- Provision Firebase Auth accounts and matching `users/{uid}` profiles with canonical `admin`/`staff` roles and `active` status. There is no in-app user-management/provisioning page.
- No Firebase Hosting, emulator, Firestore index manifest, migration runner, backup scheduler, or Cloud Functions backend is configured here. The application reads legacy archive-less documents without requiring a backfill.
- `scripts/createAdditionalAdmins.mjs` is a separate Node/Firebase Admin SDK provisioning utility for predefined accounts. It uses service-account credentials, not the browser's `VITE_FIREBASE_*` values, and is not part of application startup or deployment builds. Review its account definitions before any deliberate use; this documentation review did not run it.

### Recommended release checklist

1. Merge to the production GitHub branch.
2. Confirm Vercel build succeeds with Firebase env vars set.
3. Deploy Firestore and Storage rules if rules changed.
4. Verify login/role/status rules, all five create/edit/Trash paths (password + Archive Reason), gated Archive direct entry/re-entry, and Recover (confirmation + Recovery Reason) using disposable records. Check wrong passwords, blank reasons, refresh/logout/account access reset, legacy metadata, preserved numbering/status/events, archive exclusion, and recovered-record inclusion in active lists, reports, counts, calendar, and fresh certificate loads.
5. Check native A4 print and PDF for all five certificate types with long names, sponsors, and Purpose; verify report export/history behavior and review the current limitations in §33.

These are release steps, not deployment actions or completed checks from this documentation audit.

---

## 32. Testing

The repository provides `npm run lint` and `npm run build`, plus targeted archive regression tests under `tests/`. There is no `npm test` script or Firebase rules/emulator test configuration. This September 16 documentation review inspected source/test fixtures and the documentation diff; it did not rerun application tests/builds or perform live Firebase writes, deployment, physical printing, or UAT.

### Implemented automated archive checks

Run from the application directory after installing dependencies:

```bash
node --experimental-vm-modules --test tests/archive.test.mjs
node tests/archive-browser.mjs
```

- **Service suite (8 tests):** production services with an in-memory Firebase substitute. Covers all five archive/recovery wrappers, blank reasons, trimming, metadata/status/record identity preservation, legacy recovery, duplicate/missing-state rejection, active-list return, Dashboard counts, report rows/year discovery, retained calendar visibility, and the single-record getters used by certificates. Also covers simulated wrong/blank/correct passwords, invalid/revoked/account-changed access, and revocation during a simulated transaction.
- **Chrome UI fixture:** `tests/archive-browser.mjs` bundles `tests/archive-browser.jsx` with real React/MUI components but simulated authentication, Auth context, and archive services. Checks direct-route lock, zero archive reads with wrong/no verification, all five tabs, recovery identity/required reason without another password, row removal, route re-entry, fresh component remount, account change/logout, and the shared archive dialog for five type labels. It does not mount all five full active record pages or exercise live Firebase transactions.
- **Requirements/limits:** service tests use Node's experimental VM-module support. UI tests require local Chrome (Windows default path or `CHROME_PATH`) and start a local test server/isolated profile. Component remount models refresh reset; it is not a deployed-browser reload test. Neither suite verifies deployed rules, actual credentials, concurrent Firestore clients, or physical certificate printing.

Implementation verification on September 16, 2026 reported 8 service tests and Chrome checks passing, a successful build, and only pre-existing lint warnings. Those isolated test/build results were not rerun for this documentation-only edit and do not establish deployed acceptance testing.

The following manual and acceptance scenarios are a verification checklist, not evidence of completed tests against the deployed application.

### Manual testing

- Sign-in / sign-out / unauthorized role and inactive status
- Each sacramental module: list, search/filter, view, create (old), edit, calendar new-record path
- All five sacramental pages: reject incorrect passwords before edit/Move to Trash and empty/whitespace-only Archive Reasons; verify trimmed `archiveReason`, `archivedAt`, document retention, unchanged status/numbering/events, and exclusion from active lists, reports, years, counts, calendar, and fresh certificate loads
- Archive compatibility: missing/false archive flags stay visible; boolean true hides records; archived numbers remain reserved; stored legacy `id` values cannot override sacramental document IDs
- Archived Records: sidebar/direct URL, wrong/cancelled password, refresh, leave/re-entry, logout, and account switch must load/display no archive data before successful verification
- Recover from each tab: identity confirmation, required trimmed Recovery Reason, no second password, legacy missing metadata, preservation of archive fields/status/number/ID, and return to the correct active module on reload; no permanent purge action exists
- Verify recovered calendar events/counts/years/report rows and fresh certificate lookups on reload/regeneration; already-open previews/downloads remain unchanged; recovery must not recreate an independently missing event
- Baptism: registry references, godparent residence, Birth Certificate registry number, and preservation of stored status/time on edit
- Confirmation: age below 13 rejected, age 13 accepted, baptism parish and certificate references, legacy birth-date preservation, and certificate output without a birth date
- Death: birth/death/burial ordering and the old-record burial-date gap; Marriage/Death computed ages, including zero, and absence of a minimum marriage-age rule
- Calendar: past-date entry-point lock, changed-manual-date validation gap, date overview for busy days, manual event CRUD, sacramental event view-only, and reload after archiving/recovering a linked record
- Scheduling time: verify the four time-enabled sacramental forms preserve the chooser time and record the Conversion fixed-08:00 limitation
- Calendar ranges: end after start, overlap rejection, adjacent ranges allowed, editing without self-conflict, and legacy single-time events
- Mass Intentions: status transitions, read-only after Offered/Cancelled, delete rules
- Ministers: create/edit, Active-only assignment behavior
- Reports: generate, preview, print, PDF, recent reports
- Reports: All Years, numeric versus legacy string years, archive-aware year discovery, explicit All Ministers selection, type-change resets, and regeneration against current data
- Reproduce saved All Ministers history filtering and Daily/Weekly period limitations; verify empty previews disable Print/PDF
- Certificates: preview, native A4 print, and PDF for Baptism/Confirmation/Marriage/Death/Conversion; shared layout, Minister labels, blank Parish Priest signature, Purpose, and long-text fitting
- Confirm Purpose is not persisted, new Confirmation records can produce a blank birth-date line, and already-open previews do not automatically refresh after source changes
- Profile: personal field update, password change
- Unsaved-changes warnings on dirty forms

### Functional testing

Verify business rules from §30 (especially password-verified sacramental actions, archive access reset, required archive/recovery reasons, retention/recovery/exclusion and numbering, permanent unlocked Mass Intention deletion and event cleanup, calendar past dates and overlaps, Mass Intention locks, Proper Case, and RBAC).

### User acceptance testing (UAT)

To be conducted with parish office stakeholders using representative parish workflows:

1. Encode historical (old) records
2. Schedule upcoming sacraments from the calendar
3. Process Mass Intentions through Offered/Cancelled
4. Generate certificates for requesting parishioners
5. Produce monthly/yearly reports for office filing
6. Archive with password + reason, authenticate into Archived Records, and recover with confirmation + reason; verify the record returns to its module

---

## 33. Known Limitations

These limitations reflect the **current** implementation, verified in the referenced source paths:

1. **Archive audit/history** - viewer and recovery are implemented for all five registers, but no actor UID/email, separate archive/recovery audit log, complete multi-cycle history, purge UI, or automatic expiry exists. Each action overwrites its own reason/time fields. The viewer loads all archived records in the selected type without search/pagination or recovery-history display (`ArchivedRecords.jsx`, `archiveService.js`).
2. **No runtime DOCX export or certificate issuance register** — DOCX files are design references; certificates/PDFs and preview Purpose changes are not stored as issued artifacts.
3. **Uploads** — profile photo Storage SDK/rules are prepared, but there is no upload UI. Documentary requirements are checklists, with no attachments.
4. **Calendar scheduling gaps** — Mass Intention is absent from `SACRAMENT_SCHEDULE_OPTIONS`; Conversion ignores the chosen time and syncs at 08:00 (`conversionService`). The other four sacramental forms preserve time on edit without providing a time-change field. Manual forms opened on an allowed date can save a changed past date; only the creation entry points check today.
5. **Calendar consistency** — record/event sync and unlocked Mass Intention deletion/event cleanup are separate, best-effort operations. Failed sync can leave missing/stale events; missing sacramental parents are not hidden by the archive filter. Legacy manual events lacking start/end fields cannot block overlapping ranges.
6. **Concurrency and scale** — numbering and overlap checks are non-transactional. Lists and number allocation scan collections; calendar archive filtering adds a read per distinct linked parent. There is no server-side record pagination or live operational-data subscription. Dashboard count failures become zero (`dashboardService`).
7. **Security enforcement scope** — rules allow active staff/admin broad operational read/write, including hard deletion and archive/lock changes. Recent-password verification, record validation, calendar restrictions, and Mass Intention locks are not database-enforced. Service lock checks can also use caller-supplied record lists (§28).
8. **Mass Intention lifecycle** — unlocked forms permit all four status choices; only Scheduled → Offered/Cancelled triggers confirmation. Services do not enforce the intended transition order, and calendar sync does not filter Pending/Offered/Cancelled intentions.
9. **Audit coverage** — no Audit Logs page; only Profile, Marriage create/update, and Mass Intention operations call `createAuditLog`. Confirmation lacks creator/updater identity fields in its service; sacramental archive/recovery stores reasons and timestamps but no actor identity or separate log entries.
10. **Certificate layout coverage** — all five runtime types use the shared Baptism layout. Separate dedicated components are not selected. New Confirmation forms collect age, leaving the certificate birth-date line blank when no stored date exists. Long content is scaled onto one page and can become small; PDFs are raster images. Google Fonts may fall back when unavailable.
11. **Report period filters** — Daily/Weekly Mass Intention types are labels without day/week filtering; all use year/month. Specific-year queries require numeric `recordYear`; historical string years can appear under All Years but be missed by a selected-year query.
12. **Recent Reports** — history stores metadata, not snapshots. Reopening All Ministers passes that label as an exact minister-name filter and normally returns no rows. A type change can reset visible filters after generation; PDFs already downloaded are unaffected (`Reports.jsx`, `reportService`).
13. **Historical minister selection** — report selectors list Active ministers only, with assignment filtering for sacraments. Historical free-text/retired names may require All Ministers instead of an individual selection.
14. **Validation/editing gaps** — Baptism cannot clear an existing book/line/page value by leaving it blank; Confirmation record number is disabled on edit, and Marriage/Death/Conversion number and year are disabled in their edit forms. Old Death creation checks a past death date but not a past burial date. Marriage age validation accepts non-negative values without a minimum age. Active minister roster choices coexist with unrestricted Other/free-name entry.
15. **Remaining ID compatibility** — sacramental list/by-ID paths prioritize the actual snapshot ID, but event, report-row, and Mass Intention mappings still allow a stored `id` field to overwrite it. This matters for legacy documents containing that field.
16. **Verification/tooling** - targeted archive service and Chrome UI tests exist (section 32), but no `npm test` script, comprehensive application suite, or rules/emulator tests are configured. Simulated Firebase/authentication and remount checks do not establish live rules, real credentials, deployed refresh behavior, printer compatibility, or UAT completion. Desktop browsers remain the primary target; no native mobile app exists. Unused packages remain (`react-hook-form`, `react-icons`, `sweetalert2`).
17. **Account recovery/administration** — the reset-email service helper has no user-facing caller, and there is no in-app account provisioning/management page. Profile password change is implemented for signed-in users.

---

## 34. Future Enhancements

Features **not implemented** in Parish Connect v1.0 (candidates for later releases, not committed delivery dates):

1. **Archive administration improvements** - actor tracking, complete archive/recovery history, search/pagination, and stronger server-enforced access; browsing and recovery are already implemented
2. **Activity Logs / Audit Trail UI** — admin screen to browse `auditLogs`, plus broader write coverage across modules
3. **QR Code Certificate Verification** — issuance records and public or controlled verification
4. **OCR Digitization of Parish Books** — scan historical registers into structured records
5. **AI Duplicate Record Detection** — assist staff in finding likely duplicate persons/records
6. **Interactive Analytics Dashboard** — charts and deeper metrics beyond current summary cards
7. **Mobile Application** — native or dedicated mobile client
8. **Appointment Booking Portal** — external request portal for parishioners
9. **Multi-Parish Support** — tenancy / diocese-wide deployment model
10. **Backup and Restore** — operational backup/export tooling and a verified recovery procedure; no backup configuration is supplied here
11. **Dedicated certificate layouts / DOCX export** — optional future layout selection or Word output; all five types already generate through the shared layout
12. **Profile photo and document uploads** — wire Storage into approved user workflows
13. **Calendar completion** — expose Mass Intention quick-create, preserve Conversion chooser time, and add a time-correction workflow
14. **Report corrections** — true daily/weekly ranges, reliable saved All Ministers regeneration, and historical minister selection
15. **Data integrity and verification** — transactional numbering/conflict prevention, stronger operational rules, consistent ID mapping, scalable reads, broader application/rules tests beyond the archive fixtures, and browser/printer acceptance checks
16. **Dependency cleanup** — remove unused packages when confirmed unnecessary
17. **Account recovery/administration UI** — connect reset-email functionality and provide an authorized account-management workflow

---

## 35. Revision History

| Version | Date | Summary |
|---------|------|---------|
| Documentation 1.4 | 2026-09-16 | **Source-verified Archive revision.** Documented sidebar/route and five tabs, password-before-query/display gate, temporary account/visit access, password + Archive Reason, confirmation + Recovery Reason, transactional in-place writes, exact fields, legacy recovery, and preserved metadata/status/numbering/events. Updated reload/regeneration effects, security boundaries, audit limits, test coverage/simulation limits, development status, business rules, and future work. Supersedes prior absent-viewer/recovery statements. Last reviewed September 16, 2026. Documentation only; source/version unchanged; no migration or live acceptance claim. |
| Documentation 1.3 | 2026-09-14 | **Full source-based documentation audit of all sections and appendices.** Corrected Trash/Archive retention, boolean compatibility, reserved numbering, snapshot ID handling, archive-aware lists/lookups/reports/counts/calendar, and the then-absent restore/purge UI (viewer/recovery absence superseded by Documentation 1.4). Verified Conversion certificate preview/print/PDF, shared runtime layout, Purpose, actual Minister/signature labels, and implemented A4 fitting. Corrected authentication error routing, report filtering/history gaps, scheduling time behavior, security enforcement boundaries, audit coverage, deployment requirements, and testing claims. Removed obsolete missing-Conversion/permanent-sacramental-deletion limitations; documented remaining source-confirmed gaps and future work. Last reviewed set to September 14, 2026. Documentation only; no live deployment, application test, or UAT completion claimed. Application version unchanged. |
| Documentation 1.2 | 2026-09-07 | Recorded the introduction of sacramental Trash/Archive retention, archive filtering, password verification changes, certificate layout revisions, and record ID handling. The prior entry reported build/regression completion and ongoing final QA; those historical claims are not independently verified by this audit. Its blanket signature-label and print-overflow status descriptions are superseded by the current runtime findings in §17/§24 and verification scope in §32. Application version unchanged. |
| Documentation 1.1 | 2026-09-06 | Reviewed source through `af9abdc`. Added password-verified sacramental edit/delete, linked-event cleanup, Baptism/Confirmation registry fields and age rules, calendar time ranges and overlap checks, All Years reports, Confirmation certificate revisions, About/footer UI, provisioning utility, and updated verification checklist and limitations. Application version unchanged. |
| 1.0 | 2026-08-04 | Initial documentation alignment for Parish Connect v1.0: architecture (Vercel + Firebase), full stack including `react-to-print`, certificate preview/print/PDF workflow, calendar and Mass Intention rules, Firestore/Storage rules detail, consolidated business rules, deployment, testing, known limitations, and future enhancements. Removed outdated certificate popup-print references. The historical production-ready wording does not establish current production readiness. |

---

## Appendix A — Record numbering conventions

Record numbers are composed from year and sequence and formatted by sacrament-specific helpers in `src/utils/recordNumber.js` (Baptism, Confirmation, Marriage, Death, Conversion, Mass Intention).

Typical prefixes used in the application:

| Module | Prefix pattern (conceptual) |
|--------|-----------------------------|
| Baptism | BR |
| Confirmation | CR |
| Marriage | MR |
| Death | DR |
| Conversion | CVR |
| Mass Intention | MI-YYYY-NNN style helpers |

- **New records (calendar):** auto-number on save for the current workflow year.
- **Old records (module pages):** staff-entered year and number with duplicate prevention.
- Sacramental archive retains numbers: allocation and service duplicate checks include archived records. Display uses `PREFIX-YYYY-NNN` with a minimum of three sequence digits. These checks are not transactional.
- New sacramental numbering uses the current calendar year at save, which can differ from the scheduled date’s year. Report year filtering uses the stored `recordYear`.

---

## Appendix B — Event sources

Exact source values used in calendar/event logic:

- `manual`
- `baptism`
- `confirmation`
- `marriage`
- `death`
- `conversion`
- `massIntention`

---

## Appendix C — Documentation maintenance

This document must be updated whenever modules, statuses, routes, collections, or certificate coverage change. **Source code remains the single source of truth.** If documentation and code disagree, trust the code and revise this file.

---

*End of SYSTEM_DOCUMENTATION.md — Parish Connect v1.0*
