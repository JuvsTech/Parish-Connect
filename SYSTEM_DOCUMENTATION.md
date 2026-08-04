# Parish Connect — System Documentation

**Product:** Parish Connect **v1.0** (production-ready implementation)  
**Parish:** Immaculate Conception of the Virgin Mary Parish  
**Location:** Bani, Pangasinan  
**Diocese:** The Roman Catholic Diocese of Alaminos  

**Document purpose:** Accurate description of the **current production implementation**, derived from the application source code. Intended for thesis panels, parish staff, and future developers.  
**Source of truth:** Application source code under `src/` and Firebase rules in the repository.

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

The application is a **single-page React application** deployed on **Vercel**, using **Firebase Authentication**, **Cloud Firestore**, and (prepared) **Firebase Storage**. It is designed for internal parish office use.

### Objectives

- Maintain accurate sacramental and Mass Intention records in a centralized database
- Support scheduling through an interactive parish calendar
- Generate printable and PDF certificates from saved records
- Produce filtered reports for parish office use
- Enforce role-based access for Administrator and Staff accounts

### Scope (v1.0)

**In scope (implemented):** authentication and RBAC; Dashboard and calendar; Baptism, Confirmation, Marriage, Death, and Conversion registers; Mass Intentions; Ministers; Reports (preview / print / PDF); Certificate Preview with print and PDF for Baptism, Confirmation, Marriage, and Death; user profile and password change; client-side validation; Firestore and Storage security rules in the repository.

**Out of scope for v1.0 (see Future Enhancements):** conversion certificates, QR certificate verification, OCR digitization, AI duplicate detection, mobile apps, multi-parish tenancy, full audit-log administration UI, and related advanced features.

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

| Area | Status |
|------|--------|
| Authentication (email/password, roles, route protection) | ✔ Implemented |
| Dashboard (summary cards + parish calendar) | ✔ Implemented |
| Calendar management (click / double-click / past-date rules) | ✔ Implemented |
| Baptism, Confirmation, Marriage, Death, Conversion records | ✔ Implemented |
| Mass Intentions (Pending → Scheduled → Offered / Cancelled) | ✔ Implemented |
| Ministers management | ✔ Implemented |
| Reports (preview, PDF export, print, recent reports) | ✔ Implemented |
| Certificate generation (Baptism, Confirmation, Marriage, Death) | ✔ Implemented |
| Certificate print via `react-to-print` (native Print Preview) | ✔ Implemented |
| Certificate PDF via html2canvas + jsPDF | ✔ Implemented |
| User profile and password change | ✔ Implemented |
| Validation, Proper Case, duplicate record numbers | ✔ Implemented |
| Unsaved changes warnings | ✔ Implemented |
| Documentary requirements checklists | ✔ Implemented |
| Firebase Auth + Firestore data layer | ✔ Implemented |
| Firestore and Storage security rules files | ✔ Implemented in repo |
| Production code splitting / lazy loading | ✔ Implemented |
| Responsive admin layout | ✔ Implemented |
| Vercel SPA hosting configuration | ✔ Implemented |

### Not fully delivered in the running app

| Area | Current state |
|------|----------------|
| Conversion certificate | Button shows “coming soon”; not generated |
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
| Firebase Authentication | Email/password sign-in, password reset, session state |
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

---

## 4. Project Structure

Only folders and notable paths that **exist** in the repository:

```
Parish-Connect/
├── docs/
│   └── certificate-templates/     # DOCX design references (not runtime exporters)
├── public/                        # Static public assets
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
└── SYSTEM_DOCUMENTATION.md
```

There is **no** top-level `certificate-templates/` folder. Certificate DOCX references live under `docs/certificate-templates/`.

---

## 5. Application Routes

Defined in `src/App.jsx`. All page components load via `React.lazy` and `Suspense`.

| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/unauthorized` | Unauthorized | Authenticated but not allowed |
| `/` | Dashboard (includes calendar) | Admin, Staff |
| `/records/baptism` | Baptism Records | Admin, Staff |
| `/records/confirmation` | Confirmation Records | Admin, Staff |
| `/records/marriage` | Marriage Records | Admin, Staff |
| `/records/death` | Death Records | Admin, Staff |
| `/records/conversion` | Conversion Records | Admin, Staff |
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
- Password reset email (`sendPasswordResetEmail`)
- Role-based access: **Administrator** (`admin`) and **Staff** (`staff`)
- Firestore role alias: `administrator` is normalized to `admin`
- Session awareness via `onAuthStateChanged`
- `lastLogin` updated after the profile is fully loaded
- Inactive or missing-role users are sent to `/unauthorized`

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
- Password reset requires a valid email address format.

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
- Sacramental calendar markers are synced from sacramental / Mass Intention records; manual events are stored in the `events` collection.

### Validation rules

- Creating on past dates is blocked (calendar rules).
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

After Continue, the matching **New Record** form opens with the calendar date (and time when applicable) prefilled. These are `recordType: 'new'` records.

#### Manual calendar events

Titles include Batch Baptism, Holy Mass, Parish Meeting, Seminar, Fiesta, Novena, Procession, Wedding Rehearsal, Funeral Service, and Others (custom title required when Others is selected).

### Business rules

| Rule | Behavior |
|------|----------|
| Today | Editable for create/update of allowed items |
| Future dates | Editable |
| Past dates | No create; snackbar uses past-date locked message |
| Past **manual** events | Open in **view** mode |
| Sacramental-linked events | Not edited/deleted from the calendar; staff must edit the original sacramental / Mass Intention record |
| Multiple records same date | Supported; overview lists all items for that day |

### Validation rules

- Past date key: `dateKey < today` (local calendar day).
- Manual event forms validate required event fields and custom title when needed.
- New sacramental forms enforce today-or-future sacrament/burial/reception dates as applicable.

### Important notes

- Sacramental events on the calendar are **read-only projections**; editing happens in the sacramental module or Mass Intentions module.
- Mass Intentions are typically managed under `/mass-intentions`; they appear on the calendar when synced as events with source `massIntention`.
- Existing events on a date are always previewed in the date overview before a second create action on that day.

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
- Lifecycle status options (where used): Scheduled, Completed, Cancelled.
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

---

## 10. Confirmation Records

### Module purpose

Manage confirmation register entries and generate Confirmation certificates.

### Main features

- List / search / filter
- Old-record encoding on the Confirmation page; New-record scheduling from calendar
- Requirements checklist (Baptismal Certificate)
- Sponsors (male and female)
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
- Age handled as a positive integer when provided

### Important notes

- Certificate type: **Confirmation** — implemented.
- Requirements key: `baptismalCertificate`.

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
- Old records are historical encodings with past dates.
- Burial date cannot be earlier than date of death.
- Requirements checklist does not block save.
- Calendar sync uses burial scheduling conventions in the death service.

### Validation rules

- Burial ≥ death
- Birth vs death consistency / age rules where applied
- Duplicate year + number
- Proper Case names
- New/old burial date rules

### Important notes

- Certificate type: **Death** — implemented.
- Requirements key: `deathCertificate`.
- Minister assignment filter for death uses the **Burial** assignment in Manage Ministers.

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
- Duplicate year + number
- Proper Case names
- Residence place completeness where required

### Important notes

- **Certificate generation for Conversion is not implemented.** The UI presents a coming-soon dialog.
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

Default on create: **Pending**.

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

- Required Mass information, celebrant, requester, contact, and residence fields as enforced by the form
- Phone validation (11 digits)
- Intention-type / recipient-type consistency
- Proper Case on names

### Important notes

- This completion workflow is **Mass Intention–only**.
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
3. Sacramental forms and Mass Intention celebrant fields load **Active** ministers filtered by assignment.

### Business rules

- Only **Active** ministers are assignable to new records.
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
2. Choose type and filters → Generate.
3. Review Preview.
4. Print or Export PDF.
5. Optionally reopen from Recent Reports.

### Business rules

- Report metadata (filters, title, format) is stored in `reports`; it does **not** store a full copy of every sacramental row as a separate archive dataset beyond what the service saves for regeneration.
- Export format recorded as PDF when exporting from the preview workflow.
- Recent reports are ordered by creation time (service loads a limited recent set).

### Validation rules

- Required report type and year (and other required filters per UI messaging).

### Important notes

- PDF export uses **jsPDF** + **AutoTable**.
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
| Conversion | ✖ Coming soon (not generated) |

### How generation works (actual implementation)

1. Staff click **Generate … Certificate** on a saved record (record details dialog or edit form actions via `CertificatePrepActions`).
2. The app opens **Certificate Preview** (`CertificatePreviewDialog`).
3. The app loads the Firestore record and maps fields into certificate view data (`buildCertificateData` in `certificateService.js`).
4. A React certificate component renders the on-screen preview (layout, diocese logo, parish seal, typography) — e.g. `BaptismCertificate`, `ConfirmationCertificate`, `MarriageCertificate`, `DeathCertificate`.
5. **Print:** `react-to-print` (`useReactToPrint`) prints the **already rendered** certificate preview element and opens the browser’s **native Print Preview** (no `window.open` popup / `about:blank` tab).
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

### Certificate Preview

- Dialog title: **Certificate Preview**
- Shows loading state while record data is mapped
- Renders the full official certificate layout for review before print/PDF
- Actions: **Close**, **Print**, **Download PDF**

### Printing

- Triggered from the Print button in Certificate Preview
- Uses `react-to-print` against the preview `ref`
- Opens the browser native Print Preview for the visible certificate
- Certificate CSS (`certificate.css`) includes `@media print` / A4 portrait rules

### PDF Export

- Triggered from **Download PDF** in Certificate Preview
- Pipeline: rendered certificate DOM → `html2canvas` → PNG → `jsPDF` A4 download
- File name pattern includes sacrament prefix and record number/id

### User workflow

1. Save the sacramental record.
2. Click **Generate … Certificate**.
3. Review Certificate Preview.
4. Print (native Print Preview) and/or Download PDF.

### Business rules

- A saved `recordId` is required; certificates are generated only from existing Firestore records.
- Unimplemented sacraments show the Certificate Coming Soon dialog.
- Certificate generation does not alter the source sacramental record.

### Important notes

- Certificate Preview is opened from `CertificatePrepActions` on saved records; PDF generation uses `html2canvas` + `jsPDF` only when Download PDF is clicked.
- Route-level pages remain lazy-loaded via `React.lazy` in `App.jsx`.
- Conversion remains explicitly unimplemented in `CERTIFICATE_IMPLEMENTED`.

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
- Password rules as enforced by the password service / form

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

### Common audit fields on records

Many operational documents store `createdAt`, `updatedAt`, `createdBy`, and `updatedBy` even when a separate `auditLogs` entry is not written.

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

- Manual record year + number combinations are checked against existing records (excluding the record being edited).
- Mass Intention numbering uses the Mass Intention record-number utilities.

#### Proper Case formatting

- Person names and many proper nouns are normalized with `toProperCase` / related helpers before storage and display.

#### Date validation

- New records: today or future sacrament / relevant scheduling dates
- Old records: past dates only
- Baptism: birth date ≤ baptism date
- Death: burial date ≥ date of death
- Calendar: past dates cannot receive new creates

#### Age

- Where age is collected, positive integer validation applies.

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

#### Unsaved Changes Warning

- `useUnsavedChanges` + `UnsavedChangesDialog`
- Route-level awareness via `UnsavedChangesContext` in the admin layout
- Warns when closing a dirty form or navigating away with unsaved edits

#### Read-only restrictions

- Mass Intentions in Offered or Cancelled status
- Past manual calendar events (view mode)
- Sacramental-linked calendar events (edit/delete blocked in calendar)

#### Documentary requirements

- Checklist only; incomplete status is visible but **does not block save**

#### Form validation presentation

- Field-level errors and summary listings (`formValidationSummary` / touched + submit-attempted patterns)

---

## 23. Search and Filtering

### Module purpose

Help staff locate records quickly in large registers.

### Typical capabilities (records modules)

- Text search across primary names / numbers
- Multi-select filters (years, statuses, requirements completeness, ministers, dates, places — depending on module)
- Pagination where implemented (Mass Intentions uses a fixed page size of 10)
- Empty states when no rows match

### Reports filtering

- Report type, year, month, minister, and Mass Intention status-oriented report types

---

## 24. Printing

### Implemented print paths

| Feature | Mechanism |
|---------|-----------|
| Certificates | Print from Certificate Preview using **`react-to-print`** (`useReactToPrint` on the rendered certificate). Opens the browser native Print Preview. Does **not** use `window.open` / popup tabs. |
| Reports | Print from report preview using **`window.print()`** on the preview dialog content, with `no-print` / `@media print` styles |

PDF download is separate from printing but often used as an alternative office workflow.

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

Sacramental and other operational documents generally store creator/updater identity and timestamps even when no `auditLogs` row is created (Baptism, Confirmation, Death, and Conversion create/update paths rely on document fields rather than `createAuditLog` in the current code).

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

- Record view / add / edit form dialogs per sacrament
- Certificate Preview dialog
- Report Preview dialog
- Calendar date overview and schedule chooser dialogs
- Manual event form dialog
- Mass Intention status confirmation dialogs
- Unsaved-changes confirmation dialog
- Certificate Coming Soon dialog (Conversion)

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
- Certificate / report export error banners inside dialogs
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
- Missing/invalid role or inactive `status` → `/unauthorized`
- Profile load failure → retry UI (not treated as unauthorized)

### Protected routes

All routes under the admin shell (`/`, records, mass intentions, ministers, reports, profile) require a signed-in active user with an allowed role. See §5 Application Routes.

### Application-level controls

- Self-profile updates cannot change role / email / status privileges in UI and rules
- Mass Intention locked records blocked in UI and service layer
- Sacramental calendar events cannot be casually overwritten from the calendar editor

### Firestore Security Rules (`firestore.rules`)

Helpers: signed-in check, document owner, active user, admin (`admin`/`administrator`), staff-or-admin.

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

### Records and permanence

1. Sacramental registers (Baptism, Confirmation, Marriage, Death, Conversion) have **no hard-delete** UI or service path in v1.0; records are treated as permanent parish register entries (corrections via edit).
2. Ministers have **no delete** path in v1.0; status may be Active / Retired / Inactive.
3. Certificate generation requires an existing saved record (`recordId`) and does not modify the source record.

### Calendar

4. Calendar events **cannot be created** on past dates (`dateKey < today`, local date).
5. Days that already have events open a **date overview / preview** before adding another sacramental record or manual event.
6. Multiple events per day are supported.
7. Sacramental-linked calendar events are **view-only** from the calendar; edits happen in the source module.
8. Past **manual** events open in view mode; manual events may be deleted when allowed by UI rules.
9. Calendar “Create New Record” options: Baptism, Confirmation, Marriage, Death Record, Conversion (Mass Intention is **not** listed in that chooser).

### Mass Intentions

10. Status lifecycle: Pending → Scheduled → Offered or Cancelled.
11. **Offered** and **Cancelled** intentions are **read-only** (UI + service reject update/delete).
12. Delete is allowed only when the intention is **not** locked.
13. Mark as Offered / Cancel require confirmation dialogs (Cancel may store an optional reason).

### Numbering and formatting

14. Record numbers use sacrament-specific prefixes and year + sequence (see Appendix A); duplicates of year + number are blocked for manual/old encoding.
15. Person names are stored in **Proper Case**.
16. Phone numbers (when validated) must be exactly **11 digits**.

### Authentication and profiles

17. Only `admin` / `staff` (active) may use the admin shell.
18. Users cannot elevate their own role or change email/status through self-service profile update (UI + Firestore rules).
19. Requirements checklists are informational and **do not block** sacramental saves.

### Reports and certificates

20. Reports store metadata for regeneration; they are not a second full archive of every row.
21. Certificates are generated only for implemented types (Baptism, Confirmation, Marriage, Death); Conversion shows coming soon.

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

Defined in `.env.example` and required at build/runtime for the Vite app:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Configure the same variables in the Vercel project settings for production builds.

### Production build

```bash
npm install
npm run build
```

- Output: Vite `dist/` directory
- Local preview: `npm run preview`
- Development: `npm run dev`

### Vercel

- `vercel.json` rewrites all paths to `/index.html` so React Router deep links work.
- Connect the GitHub repository to Vercel; production builds use `npm run build` and serve `dist`.

### Firebase

```bash
firebase deploy --only firestore:rules,storage
```

- `firebase.json` references `firestore.rules` and `storage.rules` (no Firebase Hosting block is required when Vercel hosts the SPA).
- Create Administrator/Staff user profiles in the `users` collection with Auth UIDs, `role`, and `status` as required by the app.

### Recommended release checklist

1. Merge to the production GitHub branch.
2. Confirm Vercel build succeeds with Firebase env vars set.
3. Deploy Firestore and Storage rules if rules changed.
4. Smoke-test login, one sacramental module, calendar past-date lock, certificate print/PDF, and a report export.

---

## 32. Testing

Parish Connect v1.0 is validated primarily through manual and acceptance testing against the running application (automated test suite is not part of the current repository scripts).

### Manual testing

- Sign-in / sign-out / unauthorized role and inactive status
- Each sacramental module: list, search/filter, view, create (old), edit, calendar new-record path
- Calendar: past-date lock, date overview for busy days, manual event CRUD, sacramental event view-only
- Mass Intentions: status transitions, read-only after Offered/Cancelled, delete rules
- Ministers: create/edit, Active-only assignment behavior
- Reports: generate, preview, print, PDF, recent reports
- Certificates: preview, print (native Print Preview), PDF for Baptism/Confirmation/Marriage/Death; Conversion coming soon
- Profile: personal field update, password change
- Unsaved-changes warnings on dirty forms

### Functional testing

Verify business rules from §30 (especially permanence of sacramental records, calendar past dates, Mass Intention locks, duplicate record numbers, Proper Case, and RBAC).

### User acceptance testing (UAT)

Conducted with parish office stakeholders using real or representative parish workflows:

1. Encode historical (old) records
2. Schedule upcoming sacraments from the calendar
3. Process Mass Intentions through Offered/Cancelled
4. Generate certificates for requesting parishioners
5. Produce monthly/yearly reports for office filing

---

## 33. Known Limitations

These limitations reflect the **current** implementation (not speculative):

1. **Conversion certificates** are not generated (coming-soon dialog only).
2. **No runtime DOCX export** — DOCX files under `docs/certificate-templates/` are design references only.
3. **Profile photo upload** — Storage SDK and rules exist; no upload UI in the app.
4. **Mass Intention quick-create** is not listed in the calendar “Create New Record” options (Dashboard form wiring exists but is unreachable from that chooser).
5. **Sacramental / minister hard delete** is not implemented (intentional permanence for registers; ministers use status instead).
6. **Audit Logs** — write helper exists for Profile, Marriage, and Mass Intentions; there is **no Audit Logs page**, and other modules do not write `auditLogs`.
7. **Unused npm packages** remain in `package.json` (`react-hook-form`, `react-icons`, `sweetalert2`).
8. Security rules enforce only after **Firebase deploy**; local/app code alone does not apply them.
9. Primary target is desktop parish-office browsers; mobile is responsive but not a native app.

---

## 34. Future Enhancements

Features **not implemented** in Parish Connect v1.0 (candidates for later releases):

1. **Activity Logs / Audit Trail UI** — admin screen to browse `auditLogs`, plus broader write coverage across all modules
2. **QR Code Certificate Verification** — public or controlled verification of issued certificates
3. **OCR Digitization of Parish Books** — scan historical registers into structured records
4. **AI Duplicate Record Detection** — assist staff in finding likely duplicate persons/records
5. **Interactive Analytics Dashboard** — charts and deeper metrics beyond current summary cards
6. **Mobile Application** — native or dedicated mobile client
7. **Appointment Booking Portal** — external request portal for parishioners
8. **Multi-Parish Support** — tenancy / diocese-wide deployment model
9. **Backup and Restore** — operational backup tooling beyond Firebase defaults
10. **Conversion certificate generation** — parity with Baptism/Confirmation/Marriage/Death
11. **Profile photo upload** — wire Storage upload to Profile UI
12. **DOCX certificate export** — only if the parish later requires Word output
13. **Calendar Mass Intention quick-create** — expose Mass Intention in `SACRAMENT_SCHEDULE_OPTIONS` (or remove unreachable code)
14. **Dependency cleanup** — remove unused packages when confirmed unnecessary

---

## 35. Revision History

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-08-04 | Documentation aligned to production-ready Parish Connect v1.0: architecture (Vercel + Firebase), full stack including `react-to-print`, certificate preview/print/PDF workflow, calendar and Mass Intention rules, Firestore/Storage rules detail, consolidated business rules, deployment, testing, known limitations, and future enhancements. Removed outdated certificate popup-print references. |

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
