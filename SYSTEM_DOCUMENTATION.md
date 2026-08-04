# Parish Connect — System Documentation

**Parish:** Immaculate Conception of the Virgin Mary Parish  
**Location:** Bani, Pangasinan  
**Diocese:** The Roman Catholic Diocese of Alaminos  

**Document purpose:** Accurate description of the **current production implementation**, derived from the application source code. Intended for thesis panels, parish staff, and future developers.

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
26. [Responsive Design](#26-responsive-design)
27. [Error Handling](#27-error-handling)
28. [Security Features](#28-security-features)
29. [Production Optimizations](#29-production-optimizations)
30. [Planned / Remaining Improvements](#30-planned--remaining-improvements)

---

## 1. System Overview

Parish Connect is a web-based parish administration system for **Immaculate Conception of the Virgin Mary Parish (Bani, Pangasinan)**. Authorized parish staff and administrators use it to manage sacramental records, Mass intentions, ministers, parish calendar events, certificates, and reports.

The application is a **single-page React application** that talks to **Firebase Authentication** and **Cloud Firestore**. It is designed for internal parish office use (Administrator and Staff roles).

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
| User profile and password change | ✔ Implemented |
| Validation, Proper Case, duplicate record numbers | ✔ Implemented |
| Unsaved changes warnings | ✔ Implemented |
| Documentary requirements checklists | ✔ Implemented |
| Firebase Auth + Firestore data layer | ✔ Implemented |
| Firestore and Storage security rules files | ✔ Implemented in repo |
| Production code splitting / lazy loading | ✔ Implemented |
| Responsive admin layout | ✔ Implemented |

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

### Runtime

| Technology | Declared version | Role in Parish Connect |
|------------|------------------|-------------------------|
| React | `^19.2.7` | UI library |
| React DOM | `^19.2.7` | DOM rendering |
| Vite | `^8.1.1` (dev) | Build tool and dev server |
| Material UI (`@mui/material`) | `^9.2.0` | Component library |
| MUI Icons (`@mui/icons-material`) | `^9.2.0` | Icons |
| Emotion (`@emotion/react`, `@emotion/styled`) | `^11.14.0` / `^11.14.1` | MUI styling |
| Firebase | `^12.16.0` | Auth, Firestore, Storage SDK |
| React Router DOM | `^7.18.1` | Client-side routing |
| jsPDF | `^4.2.1` | PDF generation (certificates & reports) |
| jsPDF AutoTable | `^5.0.8` | Tabular report PDFs |
| html2canvas | `^1.4.1` | Certificate HTML → canvas → PDF |
| phil-reg-prov-mun-brgy | `^1.1.0` | Philippine place hierarchy data |

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

### Hosting / SPA

- `vercel.json` rewrites all routes to `/index.html` for client-side routing.

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

1. Staff click **Generate … Certificate** on a saved record.
2. The app loads the Firestore record and maps fields into certificate view data (`buildCertificateData`).
3. A React certificate component renders an on-screen preview (layout, diocese logo, parish seal, typography).
4. **Download PDF:** `html2canvas` captures the certificate element; **jsPDF** builds an A4 PDF for download.
5. **Print:** certificate HTML is sent to a print workflow (`printCertificateElement`).

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

### User workflow

1. Save the sacramental record.
2. Open Generate Certificate.
3. Preview → Print and/or Download PDF.

### Business rules

- A saved `recordId` is required.
- Unimplemented sacraments show the Certificate Coming Soon dialog.
- Certificate generation does not alter the source sacramental record.

### Important notes

- Lazy-loaded so PDF libraries are not part of every page’s initial download.
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
| `BAPTISM` | `baptism` | Baptism records |
| `CONFIRMATION` | `confirmation` | Confirmation records |
| `MARRIAGE` | `marriage` | Marriage records |
| `DEATH` | `death` | Death / burial records |
| `CONVERSION` | `conversion` | Conversion / reception records |
| `MASS_INTENTIONS` | `massIntentions` | Mass intention records |
| `EVENTS` | `events` | Parish calendar events (manual + synced) |
| `USERS` | `users` | User profiles / roles |
| `MINISTERS` | `ministers` | Minister roster |
| `REPORTS` | `reports` | Report generation metadata |
| `AUDIT_LOGS` | `auditLogs` | Security / activity audit trail |

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
| Certificates | Print from certificate preview (`printCertificateElement`) |
| Reports | Print from report preview (`window.print` on preview dialog content) |

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

## 26. Responsive Design

### Module purpose

Support parish office use on desktop and smaller screens.

### Implemented approach

- Material UI responsive Grid / Stack layouts
- Collapsible navigation drawer in `AdminLayout`
- Dialogs that go full-screen on small breakpoints where configured (for example report preview)
- Touch-friendly icon actions in tables

The primary design target remains a staff desktop/laptop browser, with usable layouts on narrower viewports.

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

### Application-level

- Firebase Authentication required for the admin shell
- Role checks (`admin`, `staff`) in `ProtectedRoute`
- Inactive status denied
- Self-profile updates cannot change role/email/status privileges
- Mass Intention locked records blocked in UI and service layer
- Sacramental calendar events cannot be casually overwritten from the calendar editor

### Firestore Security Rules (`firestore.rules`)

Implemented in the repository and referenced by `firebase.json`:

- Signed-in **active** admin/staff for operational collections:
  - `baptism`, `confirmation`, `marriage`, `death`, `conversion`, `massIntentions`, `events`, `ministers`, `reports`
- `users`: owner read/update with restricted keys; admin create/manage; delete denied
- `auditLogs`: admin read; staff/admin create with required fields; update/delete denied

### Storage Security Rules (`storage.rules`)

Implemented for `profilePhotos/{userId}/{fileName}` (owner-only, image type/size limits).

### Important note for thesis / deployment

Rules files exist in the project. They must be **deployed** to the Firebase project (`firebase deploy --only firestore:rules,storage`) to enforce in production. The application code alone is not a substitute for deployed rules.

---

## 29. Production Optimizations

Implemented without changing business behavior:

- Route-level `React.lazy` / `Suspense` for all major pages
- Dialog-level lazy loading for heavy forms, report preview, and certificate preview
- Vite / Rolldown code-splitting groups for React, MUI, Firebase, Philippine places data, jsPDF, and html2canvas
- Certificate PDF libraries load only when certificate generation or report PDF export is used
- Philippine place dataset loads with place-enabled forms rather than every initial route

---

## 30. Planned / Remaining Improvements

Based on code that is present but incomplete or unused:

1. **Conversion certificate** — finalize template and enable generation like the other four sacraments.
2. **Profile photo upload** — wire Firebase Storage upload UI to the existing Storage rules path.
3. **Optional dependency cleanup** — remove unused packages (`react-hook-form`, `react-icons`, `sweetalert2`) if not needed.
4. **Calendar Mass Intention quick-create** — either add Mass Intention to `SACRAMENT_SCHEDULE_OPTIONS` or remove the unreachable Dashboard branch.
5. **Broader audit coverage** — optional `auditLogs` entries for Baptism, Confirmation, Death, and Conversion to match Marriage / Mass Intention depth.
6. **DOCX export** — only if the parish later requires Word output; current production path is HTML preview + PDF/print.

---

## Appendix A — Record numbering conventions

Record numbers are composed from year and sequence and formatted by sacrament-specific helpers in `src/utils/recordNumber.js` (Baptism, Confirmation, Marriage, Death, Conversion, Mass Intention).

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

*End of SYSTEM_DOCUMENTATION.md*
