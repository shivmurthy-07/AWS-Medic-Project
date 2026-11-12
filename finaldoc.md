# MediConnect – Smart Healthcare & Doctor Appointment Platform

## 1. Project Title

**MediConnect – Smart Healthcare & Doctor Appointment Platform**  
Repository: Doctor-Appointment

## 2. Project Overview

MediConnect is a React web application backed by an Express and Prisma API. It supports public doctor discovery and appointment booking, patient and doctor accounts, Super Admin approval for doctor accounts, and separate patient, doctor, and administrator areas.

The frontend and API are separate npm projects in this repository. The API uses a MySQL database through Prisma.

## 3. Project Objectives

- Let patients find doctors and request appointments.
- Let doctors manage availability, appointments, prescriptions, reviews, and profile information.
- Give administrators views and management screens for platform records.
- Provide authentication and password reset flows, with Super Admin approval for doctor accounts.

## 4. Problem Statement

The project needed a working local authentication configuration and consistent branding. The backend expected a misspelled JWT environment variable even though the configured environment used `JWT_SECRET`. Doctor verification links also did not validate the token stored for the account, and the prescription delete route did not expose the `id` expected by its controller.

## 5. Features and Functionalities

Implemented application areas include:

- Public home, about, services, blog, contact, doctor search, doctor details, appointment booking, and appointment tracking pages.
- Patient registration, sign-in, dashboard, profile, favourites, appointments, invoices, prescriptions, and appointment tracking.
- Doctor registration with Super Admin approval, dashboard, availability, appointments, patient list, prescriptions, reviews, blog management, invoices, and profile settings.
- Administrator dashboard and screens for appointments, doctors, patients, reviews, transactions, and specialties.
- Forgot-password and reset-password endpoints.
- Doctor search with text, name, gender, city, price-range, specialization, and pagination filters.
- Demo administrator tokens can be flagged read-only; the API middleware blocks their write requests.

These features are based on existing routes and components. This document does not imply that every feature has been covered by end-to-end tests.

## 6. Newly Added Features

- **Strict Doctor Patient Scoping & Care History**: Updated the `getDoctorPatients` backend service and doctor patient views (`MyPatients.jsx`) to strictly return only those patients who have booked or completed consultation appointments with that specific doctor (`doctorId = userId`). Doctors with zero appointments have an empty patient list, and doctors cannot access or view patients belonging exclusively to other doctors. Enriched patient records with consultation tracking IDs, last visit dates, prescription statuses, and full appointment history with that doctor.
- **Consultation-Linked Medical Diagnostic Reports**: Refactored the `MedicalReport` schema to include a direct 1-to-many relationship with `Appointments` (`appointmentId`). Medical reports are strictly generated from and bound to verified patient-doctor consultations, eliminating phantom/orphaned records.
- **Post-Consultation Doctor-Only Diagnostic Report Generation**: Added direct consultation-gated diagnostic report authoring (`ConsultationReportGeneratorModal.jsx`) into Doctor Appointments (`Appointments.jsx`) and consultation detail view (`ViewAppointment.jsx`). Official diagnostic/consultation reports can only be published by the assigned doctor after the consultation is marked `Completed`, with customizable structured clinical findings/parameters (`recordResults`) aligned to the patient's actual chief complaint (including general consultation / chronic care / vaccination as well as cardiopulmonary, spine/neuro, abdominal, or lab panels) and optional authentic file upload (no hardcoded generic stock images).
- **Strict Doctor Report Scoping & Completion Gate**: Updated `MedicalReportService` (`createReport`, `getDoctorReports`, `getPatientReports`, `getPatientReportsByDoctor`, `getReportsByAppointment`, `getSingleReport`, `updateReport`) and `AppointmentService` (`getAppointment`, `getPatientAppointmentById`, `getDoctorAppointmentsById`, `getDoctorPatients`) to enforce strict ownership checks, strip placeholder stock URLs, and only surface consultation reports after `Completed` status.
- **In-App Clinical & PACS Report Viewer**: Upgraded `ClinicalReportViewer.jsx` to dynamically render structured patient-specific clinical observations, lab reference tables, physician impressions, and authentic uploaded scans/PDFs when attached, while hiding PACS film frames when no authentic diagnostic file exists.
- **Patient Records Portal & UI Polish**: Removed patient-side "Auto-Generate" report templates from `Reports.jsx`, `ImagingReports.jsx`, and `LabReports.jsx` (restricting patients to viewing doctor-published post-consultation reports or uploading their own genuine external documents), defaulted filters to `ALL` so non-chest records are never hidden, and fixed the low-contrast Patient Portal hero **Book Appointment** button.
- **Clinical Consultation Services Catalog**: Replaced the static placeholder loop on `/service` (which previously repeated "Child care" 6 times with identical photos) with a comprehensive, interactive catalog of 12 medical consultation specialties (Cardiology, Pediatrics, Orthopedics, Neurology, Dermatology, Dentistry, General Medicine, Telehealth Video Consult, Ophthalmology, Gynecology, ENT, and Psychiatry).
- **Specialty & Mode Filtering**: Added interactive category filter pills (Online Video Consultations, Specialized Medicine, Primary & Family Care) and live search bar to easily discover consultations by symptoms or specialties.
- **Deep-linking & Pre-filtered Doctor Booking**: Consultation cards directly link to `/doctors?specialist=<Specialty>`, with automatic synchronization into `SearchDoctor` filters and enhanced backend multi-field matching (`services` and `specialization`).
- API config recognizes the correctly spelled `JWT_SECRET` and `JWT_EXPIRES_IN` variables while keeping legacy misspelled aliases available.
- Development client URL has a localhost fallback.
- The legacy doctor verification endpoint validates tokens against the stored bcrypt hash and handles missing or expired requests; it is not part of registration or sign-in.
- Doctor login requires Super Admin approval; email verification status does not gate login.
- Login navigation uses the authenticated account role.
- Footer registration links open the existing registration panel instead of a nonexistent `/register` route.
- The prescription delete route now includes the prescription ID parameter.
- Registration and password-reset endpoints enforce the UI password policy; new account email addresses are normalized.
- Bearer JWTs are accepted, and sensitive patient, doctor, appointment, prescription, medicine, blog, review-reply, and availability operations are scoped by role and record ownership.
- Public appointment confirmation and tracking responses are limited to schedule/status and public clinic details. New tracking IDs use cryptographically random values.
- Patients can cancel their own appointments; those requests cannot modify payment, doctor, or patient identifiers.
- Availability deletion includes a slot ID, prescription update/delete client paths match the API, and schedule changes are restricted to the authenticated doctor.
- Appointment creation no longer marks payment as paid without a payment processor; new appointments remain unpaid.
- Admin API response transforms handle backend arrays, and the dashboard no longer shows fabricated trend percentages.
- Nonfunctional social sign-in buttons and demo credential examples were removed rather than presented as working authentication.

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Create React App / `react-scripts`, React Router |
| UI | React Bootstrap, Ant Design, Bootstrap, React Icons |
| API state and requests | Redux Toolkit Query, Axios |
| Backend | Node.js, Express 4, TypeScript |
| Database access | Prisma 6 |
| Database | MySQL |
| Authentication | JSON Web Tokens, bcrypt |
| Other integrations | Nodemailer, Cloudinary |

Node.js 24.21.0 and npm 11.19.0 were available during validation.

## 8. System Architecture

1. The React single-page application serves routes from `src/App.jsx`.
2. Redux Toolkit Query calls the API through a shared Axios base query.
3. The API mounts module routers below `/api/v1`.
4. Express controllers call module services; services use the shared Prisma client.
5. Prisma reads and writes the MySQL database described by `api/prisma/schema.prisma`.
6. Email and image-upload functionality uses Nodemailer and Cloudinary configuration when those services are configured.

## 9. Frontend Architecture

- `src/App.jsx` defines public, protected, and admin route groups.
- `src/redux/api/` contains endpoint definitions and cache tags.
- `src/helpers/axios/` configures API requests and response extraction.
- `src/helpers/config/envConfig.js` chooses the local or live API origin and appends `/api/v1` if it is missing.
- `src/components/Login/` implements sign-in, registration, forgot-password, and reset-password screens.
- `src/components/Doctor/`, `src/components/Admin/`, and `src/components/Shared/` contain role-specific screens and shared navigation.

The frontend extracts the API response's `data` property and stores the access token in browser local storage. Requests send the standard Bearer authorization header; the API also accepts legacy raw JWT headers during transition.

## 10. Backend Architecture

- `api/src/server.ts` starts the Express server.
- `api/src/app.ts` configures JSON parsing, CORS, static files, routes, and error responses.
- `api/src/app/routes/index.ts` mounts module routers.
- `api/src/app/modules/` contains route, controller, and service files for each domain.
- `api/src/app/middlewares/auth.ts` verifies access tokens and checks role requirements.
- `api/src/app/middlewares/demoAdminGuard.ts` blocks write operations for demo administrators.
- `api/src/shared/prisma.ts` exports the Prisma client.

## 11. Database Architecture

Prisma uses the MySQL provider. Incremental MySQL migrations are checked in under `api/prisma/migrations`; review and back up the target database before applying them. Use `prisma migrate deploy` for a database with the existing schema, not `db push` as a substitute for migration review.

## 12. Database Schema and Relationships

The schema defines these models:

- `Auth`: unique email, password hash, role, optional related user ID, and demo-admin flag.
- `Patient`: contact/profile fields; related appointments, reviews, prescriptions, and favourites.
- `Doctor`: professional/profile fields, verification flag, appointments, prescriptions, reviews, favourites, time slots, and blogs.
- `Appointments`: optional patient and doctor relations, schedule and status fields, tracking ID, prescriptions, and payments.
- `Payment`: belongs to an appointment.
- `Reviews`: relates a patient and doctor.
- `Prescription`: relates a doctor, patient, and appointment; contains medicines.
- `Medicine`: belongs to a prescription.
- `Favourites`: relates a patient and doctor.
- `DoctorTimeSlot`: belongs to a doctor and contains schedule-day records.
- `ScheduleDay`: start/end time and optional time-slot relation.
- `Blogs`: belongs to a doctor.
- `UserVerfication` and `ForgotPassword`: verification/reset records with expiration.

Roles are `admin`, `patient`, `doctor`, and `super_admin`. Several date, amount, or status values are currently represented as strings or nullable fields; refer to the Prisma schema for exact nullability and types.

## 13. Authentication and Authorization

- Login is `POST /api/v1/auth/login` with `{ "email": "...", "password": "..." }`.
- Passwords are stored using bcrypt in the registration services.
- A successful login returns an access token and user role; the API also sets an HTTP-only `accessToken` cookie.
- The frontend stores the returned token in local storage and sends it using the standard Bearer authorization scheme.
- Doctor accounts must be approved by a Super Admin before login; email verification is not required.
- Admin sign-up is not exposed by the public sign-up form. An administrator account must be provisioned separately with a bcrypt password hash and `role = admin`.
- There is no dedicated server-side logout endpoint; the frontend logs out by removing its local token.
- Sensitive patient and appointment routes now require authentication and enforce record ownership. Public doctor discovery, public blog/review content, guest appointment creation, and tracking by tracking ID remain intentional public flows; tracking responses expose appointment status/schedule and public clinic information only.

## 14. API Endpoints

All API paths below are relative to `/api/v1`. Successful API responses generally use `{ "statusCode", "success", "message", "data", "meta" }`; errors use `{ "success": false, "message": ... }`. `Authorization: Bearer <token>` is required where marked; the API also accepts legacy raw JWT values for compatibility.

| Method and path | Authentication | Request body / query | Purpose and response |
|---|---|---|---|
| `POST /auth/login` | Public | `{ email, password }` | Returns `{ accessToken, user: { role, userId, email, isDemo } }`. |
| `POST /auth/reset-password` | Public | `{ email }` | Starts password-reset email flow. |
| `POST /auth/reset-password/confirm` | Public | `{ userId, uniqueString, password }` | Changes password using reset request. |
| `GET /auth/user/verify/:userId/:uniqueString` | Legacy verification token | URL parameters | Legacy compatibility route; not part of doctor signup, approval, or login. |
| `GET /auth/verified` | Public | None | Legacy verification success page. |
| `GET /auth/expired/link` | Public | None | Legacy verification-expired page. |
| `GET /doctor` | Public | Query: `searchTerm`, `firstName`, `lastName`, `gender`, `city`, `min`, `max`, `specialist`, `limit`, `page`, `sortBy`, `sortOrder` | Lists/filter doctors with pagination metadata. |
| `POST /doctor` | Public registration | Doctor profile fields plus `password` | Creates a pending doctor application; no verification email is sent. A matching rejected/pending application can be resubmitted/continued using the original credentials. |
| `GET /doctor/:id` | Public | Path ID | Returns doctor profile. |
| `PATCH /doctor/:id` | Owning doctor or admin | Multipart form with `data` and optional `file` | Updates a doctor profile; doctor accounts can update only their own profile. |
| `DELETE /doctor/:id` | Admin | Path ID | Deletes a doctor account. |
| `GET /patient` | Admin | None | Lists patient records. |
| `POST /patient` | Public registration | Patient profile fields plus `password` | Validates required names, email, and password; creates patient and auth records. |
| `GET /patient/:id` | Owning patient or admin | Path ID | Returns the authenticated patient's record or an admin-requested record. |
| `PATCH /patient/:id` | Owning patient or admin | Multipart form with `data` and optional `file` | Updates only the caller's profile unless the caller is an admin. |
| `DELETE /patient/:id` | Admin | Path ID | Deletes a patient and auth record. |
| `GET /appointment` | Admin | None | Lists appointments with doctor/patient summary and payment rows. |
| `GET /appointment/:id` | Owning patient, assigned doctor, or admin | Path ID | Returns full appointment details only to an authorized owner/participant. |
| `GET /appointment/confirmation/:id` | Public | Appointment ID | Returns a limited booking confirmation view without patient contact or visit-reason fields. |
| `POST /appointment/create` | Public; optional patient token | Appointment and contact fields | Creates a guest booking or associates a booking only with the authenticated patient's own account. Payment remains unpaid until a real gateway is integrated. |
| `POST /appointment/create-un-authenticate` | Public | Appointment/contact fields | Creates an appointment for an unauthenticated visitor. |
| `POST /appointment/tracking` | Public | Tracking identifier | Returns appointment status and schedule plus public clinic information; patient contact and visit-reason fields are excluded. |
| `GET /appointment/patient/appointments` | Patient token | None | Lists the authenticated patient's appointments. |
| `GET /appointment/patient/invoices` | Patient token | None | Lists patient payment/invoice records. |
| `GET /appointment/doctor/appointments` | Doctor token | None | Lists the authenticated doctor's appointments. |
| `GET /appointment/doctor/patients` | Doctor token | None | Lists doctor patients. |
| `GET /appointment/doctor/invoices` | Doctor token | None | Lists doctor invoices. |
| `GET /appointment/patient-payment-info/:id` | Owning patient, assigned doctor, or admin | Appointment ID | Returns payment information after ownership validation. |
| `PATCH /appointment/:id` | Admin, assigned doctor, or owning patient | Appointment update fields | Patients can only cancel their own appointment; doctors can only change permitted status/follow-up fields on assigned visits. |
| `PATCH /appointment/doctor/update-appointment` | Assigned doctor | Appointment status/update fields | Updates an appointment assigned to the authenticated doctor. |
| `DELETE /appointment/:id` | Admin | Path ID | Deletes an appointment. |
| `GET /timeslot` | Public | Optional query filters | Lists time slots. |
| `GET /timeslot/appointment-time/:id` | Public | Doctor ID | Returns appointment-time information. |
| `GET /timeslot/my-slot` | Doctor token | None | Lists the authenticated doctor's slots. |
| `GET /timeslot/:id` | Owning doctor | Slot ID | Gets the authenticated doctor's slot. |
| `POST /timeslot/create` | Doctor token | Time-slot and schedule fields | Creates availability. |
| `PATCH /timeslot` | Doctor token | Slot update fields | Updates only the caller's availability. |
| `DELETE /timeslot/:id` | Owning doctor | Slot ID | Deletes the doctor's availability and its schedule-day rows. |
| `GET /prescription` | Admin | None | Lists prescriptions. |
| `GET /prescription/:id` | Owning patient, prescribing doctor, or admin | Prescription ID | Returns prescription details only to an authorized owner/participant. |
| `GET /prescription/doctor/prescription` | Doctor token | None | Lists doctor prescriptions. |
| `GET /prescription/patient/prescription` | Patient token | None | Lists patient prescriptions. |
| `POST /prescription/create` | Assigned doctor | Prescription, appointment, and medicine fields | Creates a prescription only for the doctor's appointment. |
| `PATCH /prescription/:id` | Prescribing doctor or admin | Prescription fields | Updates a prescription; the frontend and API path now match. |
| `PATCH /prescription/update-prescription-appointment` | Prescribing doctor | Prescription ID and appointment update fields | Updates a prescription and its linked appointment after ownership validation. |
| `DELETE /prescription/:id` | Prescribing doctor or admin | Prescription ID | Deletes a prescription after ownership validation. |
| `GET /review` | Public | None | Lists reviews. |
| `GET /review/:id` | Public | Review ID | Returns a review. |
| `GET /review/doctor-review/:id` | Doctor or patient token | Doctor ID | Lists doctor reviews. |
| `POST /review` | Patient token | Review fields | Creates a review. |
| `PATCH /review/:id` | Admin token | Review update fields | Updates a review. |
| `PATCH /review/:id/reply` | Doctor token | Response text | Replies to a review. |
| `DELETE /review/:id` | Admin token | Review ID | Deletes a review. |
| `GET /favourite` | Patient token | None | Lists patient favourites. |
| `POST /favourite/add` | Patient token | Doctor ID | Adds a favourite. |
| `POST /favourite/remove` | Patient token | Doctor ID | Removes a favourite. |
| `GET /blogs` | Public | None | Lists blogs. |
| `GET /blogs/:id` | Public | Blog ID | Returns a blog. |
| `POST /blogs` | Doctor token | Blog fields and optional image file | Creates a blog. |
| `PATCH /blogs/:id` | Owning doctor or admin | Blog fields and optional image file | Updates a blog without permitting an author reassignment. |
| `DELETE /blogs/:id` | Owning doctor or admin | Blog ID | Deletes a blog after ownership validation. |
| `POST /medicine` | Doctor token | Medicine fields | Creates medicines only under the doctor's prescriptions. |
| `PATCH /medicine` | Doctor token | Medicine ID and update fields | Updates a medicine only under the doctor's prescription. |
| `DELETE /medicine/:id` | Doctor token | Medicine ID | Deletes a medicine only under the doctor's prescription. |
| `POST /contact` | Public | Contact form fields | Submits a contact request. |

The API does not publish an OpenAPI specification or centralized request schemas. For exact optional fields and response model details, consult each module's controller, service, and Prisma model.

## 15. Project Folder Structure

```text
.
├── public/                    # CRA HTML and public assets
├── src/
│   ├── components/            # Public, login, patient, doctor, admin, shared UI
│   ├── redux/api/             # RTK Query API definitions
│   ├── helpers/axios/         # API request configuration
│   ├── service/               # Auth token helpers
│   └── utils/                 # Shared utilities and hooks
└── api/
    ├── prisma/schema.prisma   # MySQL schema
    ├── src/app/modules/       # Express modules
    ├── src/app/middlewares/   # Authentication and demo-admin policy
    ├── src/config/            # Environment configuration
    └── template/              # Email/verification templates
```

## 16. Installation Requirements

- Node.js 24 (Node 20 or newer is required by the API package).
- npm.
- A reachable MySQL database.
- Optional: SMTP/Gmail app password for email, and Cloudinary credentials for image uploads.

## 17. Environment Variable Configuration

Create `api/.env` from `api/.env.example`. Configure:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection URL, e.g. `mysql://USER:PASSWORD@HOST:3306/DATABASE`. |
| `PORT` | API listen port; use `5050` locally. |
| `NODE_ENV` | Use `development` locally and `production` in deployment. |
| `JWT_SECRET` | Long, private signing key. The legacy `JWT_SCRET` spelling is also accepted. |
| `JWT_EXPIRES_IN` | Token lifetime; legacy `JWT_EXPIRED_IN` is also accepted. |
| `JWT_REFRESH_SECRET` | Configured refresh secret; legacy `JWT_REFRESH_SCRET` is also accepted. A refresh-token API is not currently exposed. |
| `JWT_SCRET_SALT_ROUND` | Present in the example file but not used by the current code; bcrypt calls currently use 12 rounds. |
| `CLIENT_LOCAL_URL` | Local frontend origin; defaults to `http://localhost:3000` in development. Legacy `CLIENT__LOCAL_URL` is accepted. |
| `CLIENT_URL` | Deployed frontend origin. |
| `BACKEND_LOCAL_URL` / `BACKEND_LIVE_URL` | Legacy verification-link settings; not needed for doctor registration or approval. |
| `EMAIL_PASS`, `GMAIL_APP_EMAIL` | Optional Gmail sender configuration for password-reset and notification emails; not needed for doctor signup, approval, or login. |
| `ADMIN_EMAIL` | Optional administrator contact address; it is not used as the Gmail sender. |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary account configuration. The current config code reads the legacy spelling `CLOUND_NAME` for `CLOUD_NAME`. |
| `DOCTOR_PASS`, `PATIENT_PASS`, `DEFULT_ADMIN_DOCTOR` | Legacy/default account configuration values; not required for regular patient or doctor sign-up. |
| `SHOW_ERROR_DETAILS` | Enables additional API error details when set to `true`; development already enables details. |

The frontend reads `REACT_APP_USE_LOCAL_API`, `REACT_APP_API_BASE_URL_LOCAL`, `REACT_APP_API_BASE_URL_LIVE`, and the fallback `REACT_APP_API_BASE_URL`. For local development, put this in the repository-root `.env`:

```env
REACT_APP_USE_LOCAL_API=true
REACT_APP_API_BASE_URL_LOCAL=http://localhost:5050
```

Never commit actual database passwords, JWT keys, SMTP passwords, or Cloudinary credentials.

## 18. Database Setup

1. Create a MySQL database and a user with access to it.
2. Set `DATABASE_URL` in `api/.env`.
3. Ensure the database is reachable from the development machine.

## 19. Prisma Setup

From the `api` directory:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Back up existing data before applying migrations to a non-disposable database. Do not run these commands against production until the migration plan has been reviewed and the target database has been confirmed.

## 20. Frontend Setup

From the repository root:

```powershell
npm install
```

Set the frontend environment variables described in Section 17.

## 21. Backend Setup

From the `api` directory:

```powershell
npm install
npx prisma generate
```

The API package's `start` script runs the development server. `npm run build` compiles TypeScript; `npm run compile` starts the compiled server.

## 22. Application Execution Commands

Open two terminals.

**Terminal 1 — API:**

```powershell
Set-Location api
npm install
npx prisma migrate deploy
npx prisma generate
npm start
```

**Terminal 2 — frontend (repository root):**

```powershell
npm install
npm start
```

Open `http://localhost:3000`; the API listens on `http://localhost:5050` unless `PORT` is changed.

## 23. Testing Instructions

- Frontend production compilation: from the root, `npm run build`.
- Backend type-check/compile: from `api`, `npm run build`.
- API lint check: from `api`, `npm run lint:check`.
- Backend schema tests: from `api`, `npm run test:validation` (builds the API and runs Node's built-in test runner).
- Frontend tests: from the root, `npm test -- --watchAll=false --runInBand`.
- These targeted tests do not replace database-backed integration or end-to-end tests.
- Test registration, Super Admin approval, login, appointments, and role-specific API calls against a non-production database before release. Separately test email delivery for password-reset and notification workflows if configured.

## 24. Test Results

Validation actually performed with Node.js 24.21.0 and npm 11.19.0:

- Frontend `npm run build`: passed.
- Backend `npm run build` (`tsc` and template copy): passed.
- `npx prisma validate --schema .\prisma\schema.prisma`: passed.
- Live API login request using a deliberately nonexistent `.invalid` email: HTTP 401 with the expected generic invalid-credentials response. The API queried the configured database; no account was created or changed.
- Local CORS probe from `http://localhost:3000`: the API returned the configured allowed origin.
- Bearer JWT role/ownership probes: patient access to the patient list, another patient's record, appointment list, and prescription list each returned HTTP 403.
- Weak-password patient registration probe: HTTP 400; it did not create a record.
- Frontend `npm test -- --watchAll=false --runInBand`: latest run passed (2 suites, 5 tests), including doctor signup approval messaging.
- API `npm run lint:check`: not passed; ESLint could not select between duplicate root/API `@typescript-eslint` plugin installations.
- Prisma Client generation after the latest schema change returned Windows `EPERM` while replacing a locked query-engine DLL; generation remains unverified for the latest schema.
- API `npm run test:validation`: latest run passed (8 schema-focused tests, including a TypeScript build).
- API build, Prisma schema validation, and `git diff --check`: passed after the validation changes.
- Database migration deployment, API integration tests, password-reset/notification email delivery, Cloudinary uploads, and end-to-end workflows were not run.
- Real account login, successful registration, appointment creation/cancellation using test records, and payment processing were not exercised.

The frontend build reports an outdated Browserslist database, a deprecated Node API warning, and a large JavaScript bundle; compilation completed successfully.

## 25. Security Improvements

- JWT configuration accepts documented `JWT_SECRET` and `JWT_EXPIRES_IN` names (legacy misspellings remain supported); sensitive routes enforce role and record ownership checks.
- Passwords use bcrypt; registration and password reset enforce a strong-password policy. Invalid login credentials use a generic authentication error, and doctor login is gated by Super Admin approval.
- The legacy verification endpoint compares a submitted token with its stored bcrypt hash and checks expiration; it is not required for doctor account access.
- Patient/doctor profile actions, appointments, prescriptions, medicines, availability, blog edits, and doctor review replies are scoped to an authorized owner or admin.
- Demo-admin write protection accepts Bearer tokens. CORS is restricted to configured frontend origins.
- Public appointment confirmation/tracking routes omit patient contact and visit-reason data; newly created tracking IDs are cryptographically random.

This is not a production security audit. Rate limiting, security monitoring, and an authorization review for new routes remain necessary. Old tracking IDs were not migrated and remain less predictable than newly generated IDs.

## 26. UI/UX Improvements

- Updated the browser title, shared navigation/footer, global palette, and login panel to MediConnect's teal/emerald color scheme.
- Improved login copy, signup validation, forgot-password submission handling, and error feedback; removed demo credential examples and nonfunctional social sign-in choices.
- Footer registration links now open the registration panel on the login page.
- Replaced the legacy DoctorOnCall artwork in navigation, admin, and printable invoices with a MediConnect medical mark; added a matching browser icon and updated reset-password email branding.
- Login errors distinguish invalid credentials from pending, rejected, or suspended doctor accounts.
- Added an owner-checked patient appointment cancellation action and minimized data on public tracking/confirmation views.
- Admin dashboard values now use returned data and no longer show hardcoded trend percentages.
- Doctor profile locations now use the doctor's saved clinic/address details, show an India-focused Google Maps embed, and link to directions; fabricated US clinic addresses and schedules were removed.
- Replaced hard-coded Bangladesh/US map and location examples across contact, booking, invoices, doctor cards, and doctor profiles. Doctor profiles now use India as their country; education, experience, services, and awards display saved doctor data rather than fabricated US credentials.

Existing role dashboards and feature pages were retained rather than redesigned wholesale; their other page-specific styles remain in place.

## 27. Troubleshooting Guide

| Symptom | Checks |
|---|---|
| Login fails with token-signing error | Ensure `api/.env` contains a non-empty `JWT_SECRET`; restart the API after changing environment values. |
| Frontend cannot reach API | Confirm the API is listening on the configured port and root `.env` points to the API origin (not `/api/v1` is also acceptable). Restart the React dev server after `.env` changes. |
| Prisma cannot connect | Confirm MySQL is reachable and `DATABASE_URL` has the correct host, port, database, and credentials; then run `npx prisma generate`. |
| Doctor cannot sign in | Confirm the account is approved and not suspended; pending and rejected applications cannot sign in. Email transport is not required for doctor signup or approval. |

## 28. Super Admin and Doctor Approval

The Super Admin area is separate from the existing `admin` role at `/super-admin/login`. Public signup only creates patient or doctor accounts; the Super Admin role is created only by the protected bootstrap script.

### Database migration and initial account

Back up the MySQL database first. From the `api` directory:

```powershell
npx prisma generate
```

The checked-in migrations are incremental and assume the original application tables already exist. For a database without Prisma migration history, synchronize it once with `npx prisma db push`, verify it matches `api/prisma/schema.prisma`, then mark `20261029_favourites_per_patient` and `20261029_super_admin_approval` applied using `npx prisma migrate resolve --applied <migration-name>`. For a database already managed by Prisma Migrate, use `npx prisma migrate deploy`. Do not mark migrations applied or ignore data-loss warnings until the target schema and existing data have been checked.

The migrations add doctor approval fields, a patient active flag, the `super_admin` auth role, the append-only-by-API activity log table, and the per-patient favourite uniqueness constraint. Every existing doctor receives `PENDING`; this deliberately avoids automatically approving legacy accounts. Review and approve those records in the Super Admin dashboard.

Optionally set these values in `api/.env` (do not commit them), then run the idempotent bootstrap command:

```env
SUPER_ADMIN_EMAIL=superadmin
SUPER_ADMIN_PASSWORD=Use-A-Unique-12-Character-Password!
```

```powershell
npm run seed:super-admin
```

Run this from either the repository root or the `api` directory. From the repository root, the root npm script forwards the command to the API package.

For local development, both settings are optional: without them, the bootstrap creates the `superadmin` username and prints a cryptographically generated password once. Save that password before closing the terminal. In production, set both values explicitly. `SUPER_ADMIN_EMAIL` may be a username (3-64 letters, digits, dots, underscores, or hyphens); no real email account is needed for a college/demo project. Sign in with that same username. The bootstrap script hashes the password with bcrypt, refuses to convert an existing non-Super Admin account, and does not reset an existing Super Admin password. Remove any configured bootstrap password from the environment after creation. Normal `/doctor` and `/patient` signup cannot assign the Super Admin role.

### Doctor workflow

Doctor registration requires selecting a specialization and creates a `PENDING` application without sending or requiring an email-verification link. The signup popup says: **"Registration Successful! Your account is waiting for Super Admin approval. You will be able to log in after your account is approved."** A Super Admin can approve a pending doctor directly. Rejected doctors can resubmit from the existing signup form using their original credentials; the application returns to `PENDING`. Pending, rejected, and suspended doctors cannot log in. Approval and status changes are recorded with actor and timestamp in `ActivityLog`.

An approved doctor with an incomplete professional profile is sent to profile settings. Dashboard routes and doctor-only APIs remain blocked until the same required fields used by the profile completion UI are complete. Doctor status is checked against the database on protected API requests, so a previously issued token cannot continue to be used after suspension. Public doctor search, doctor profiles, and appointment booking are limited to approved doctors.

### Super Admin routes

All `/api/v1/super-admin/*` endpoints require a valid `super_admin` bearer token.

| Method and path | Purpose |
|---|---|
| `GET /api/v1/super-admin/dashboard` | Real doctor, patient, appointment, prescription, registration, and activity totals |
| `GET /api/v1/super-admin/doctors` | Paginated doctor list; accepts `status`, `search`, `page`, and `limit` |
| `GET /api/v1/super-admin/doctors/pending` | Paginated pending doctor queue; accepts `search`, `page`, and `limit` |
| `GET /api/v1/super-admin/doctors/:id` | Professional review detail, appointment count, and profile completion |
| `PATCH /api/v1/super-admin/doctors/:id/approve` | Approve a pending doctor |
| `PATCH /api/v1/super-admin/doctors/:id/reject` | Reject a pending application; body: `{"reason":"..."}` |
| `PATCH /api/v1/super-admin/doctors/:id/suspend` | Suspend an approved doctor |
| `PATCH /api/v1/super-admin/doctors/:id/reactivate` | Reactivate a suspended doctor |
| `GET /api/v1/super-admin/patients` | Paginated basic patient account information; accepts `search`, `page`, and `limit` |
| `PATCH /api/v1/super-admin/patients/:id/status` | Activate/deactivate; body: `{"isActive":true}` or `false` |
| `GET /api/v1/super-admin/users` | Paginated account/role list without credentials; accepts `search`, `role`, `page`, and `limit` |
| `PATCH /api/v1/super-admin/users/:id/role` | Change a standard role; body: `{"role":"admin"}`, `{"role":"doctor"}`, or `{"role":"patient"}` |
| `GET /api/v1/super-admin/appointments` | Paginated appointment monitoring; accepts `search`, `status`, `from`, `to`, `page`, and `limit` |
| `GET /api/v1/super-admin/activity-logs` | Read-only paginated activity log; accepts `search`, `page`, and `limit` |
| `POST /api/v1/auth/logout` | Records Super Admin logout and clears the API cookie |

These pages intentionally omit patient medical notes, visit reasons, diagnoses, and password/authentication data. Patient account deactivation is enforced at login and on authenticated API requests.

### Running and testing this feature

Run the API and frontend using the commands in Section 22 after applying the database migration and creating the Super Admin account. Visit `/super-admin/login`, approve a pending doctor from Doctor approvals, then use the normal doctor login. Search and filters are paginated; status changes prompt for confirmation, and rejection requires a reason.

The doctor signup and approval workflow does not send verification email; Gmail configuration is only relevant to separate password-reset and notification email workflows.
| Prisma Client generation fails on Windows with `EPERM` renaming the query-engine DLL | Close only the API process using that generated client, then rerun `npx prisma generate`; do not terminate unrelated processes. |
| ESLint reports duplicate `@typescript-eslint` plugins | Resolve the root/API duplicate plugin installations before rerunning `npm run lint:check`. |
| Uploaded images fail | Verify Cloudinary credentials and network access. |
| Changed schema is not reflected | Review and back up the intended database, deploy the checked-in migrations, and regenerate Prisma Client. |

## 28. Known Limitations

- Automated tests currently cover selected frontend behavior and backend schemas only; they do not exercise API controllers, a database, authentication journeys, uploads, or end-to-end workflows.
- Successful account login/registration, password-reset/notification email delivery, appointment create/cancel with test records, and Cloudinary uploads were not exercised.
- Fresh Prisma Client generation after the latest schema change was blocked by a Windows query-engine DLL lock; the API TypeScript build passed with the existing generated client.
- No payment gateway is integrated. Booking records remain unpaid until a real processor confirms payment.
- Older sequential tracking IDs remain stored, and public tracking has no rate limiter, although its response is minimized and new IDs are random.
- No separate refresh-token endpoint exists; server logout currently serves the Super Admin flow.
- The new migrations have not been applied to a database. Confirm the target database and back it up before migration.
- Application-wide responsive redesign, appointment reminders, calendar rescheduling, notification center, and analytics enhancements were not added.
- Not every frontend form has accessible field-level validation, and frontend/backend rules are not shared through a single package.

## 29. Future Enhancements

- Add API and frontend unit/integration tests plus patient, doctor, and admin end-to-end scenarios.
- Add formal Prisma migrations and a safe admin-seeding process.
- Add centralized request validation, rate limiting, and security monitoring.
- Integrate a payment processor before enabling paid appointment status.
- Complete responsive UI modernization and keyboard/accessibility review.
- Consider appointment reminders, rescheduling, notification center, calendar views, and verified patient reviews after the foundational workflows are tested.

## 30. Conclusion

The project now has stricter backend input validation for its primary account, scheduling, and clinical-data APIs, plus targeted automated schema tests. This is a validated improvement, not a claim that every frontend form or end-to-end workflow is complete.

## 31. Validation Architecture, Coverage, and Results

### Validation flow

- Backend request schemas use Zod and are evaluated by `api/src/helpers/validation.ts`. Invalid data is rejected with HTTP 400 before Prisma writes; strict object schemas reject unsupported properties such as client-supplied roles, ownership IDs, approval flags, and payment amounts.
- Shared registration checks normalize names and email addresses, enforce the current password policy (8-128 characters with upper/lowercase, digit, and symbol), and reject unexpected registration properties.
- Module schemas are applied in services for authentication, patients, doctors, appointment booking and updates, time slots, blogs, reviews, favourites, medicines, prescriptions, and Super Admin operations.
- Appointment booking validates future timestamps, allowed payment choices, doctor approval, a matching 30-minute availability interval, and existing capacity for the selected time. The doctor fee is read from the database, not accepted from the request. A database-backed concurrency test was not run; concurrent booking safety is not certified.
- Patient profile updates accept only supported profile fields and cannot change email, account status, or ownership. Password reset requests use a generic response for unknown email addresses.
- JSON request bodies are limited to 1 MB. Image uploads are limited to one JPEG, PNG, or WebP file up to 5 MB; upload handling checks both declared MIME type and file signature before sending the image to Cloudinary.
- Frontend validation remains implemented separately in React. Appointment details and the patient profile have focused checks, but there is no shared frontend/backend validation package and not every form has equivalent accessible field errors.
- API validation errors use the existing `{ "success": false, "message": "..." }` response shape. Unexpected errors are handled by the global API error handler; database/provider errors are not intentionally returned as validation successes.

### Database constraints and migrations

- Prisma schema validation passes. The schema preserves existing MySQL model types and adds a composite patient/doctor favourite constraint so one doctor can be favourited by multiple patients while preventing duplicate pairs.
- `api/prisma/migrations/20261029_favourites_per_patient/migration.sql` replaces the former global unique doctor constraint with the composite key. The Super Admin migration is also present under `api/prisma/migrations/`.
- The configured local MySQL database was synchronized to the Prisma schema and the existing schema was baselined by marking both checked-in migrations as applied. `prisma migrate status` reports the database up to date, the live-schema diff is empty, and a patient query successfully reads `isActive`. This did not verify migration deployment against a separate disposable database.
- Prisma Client generation for the latest schema was blocked by Windows `EPERM` replacing a locked engine DLL. Do not stop a shared API process without identifying its owner; retry generation after the process using that engine is safely shut down.

### Validation matrix

| Module | Fields and operations checked | Frontend validation | Backend validation | Automated tests |
|---|---|---|---|---|
| Patient | Registration name/email/password; profile fields, date of birth, phone, allowed update fields, and ownership | PARTIAL | PASS | PARTIAL |
| Doctor | Registration/profile fields, IDs, search filters, pagination, approval state, and availability intervals | PARTIAL | PASS | PARTIAL |
| Super Admin | Doctor rejection reason, account status/role inputs, list filters, IDs, and protected routes | PARTIAL | PASS | PARTIAL |
| Authentication | Login, registration password/email, reset request/confirmation, verification-link ID/token bounds, and role checks | PARTIAL | PARTIAL | PARTIAL |
| Appointment | Patient/contact data, future date/time, payment enums, status updates, ownership, doctor approval, availability, and existing slot capacity | PARTIAL | PARTIAL | PARTIAL |
| Other modules | Blog payload/query/IDs; review fields/replies; favourite doctor ID; prescription fields; medicine lists; contact fields; image upload restrictions | PARTIAL | PARTIAL | PARTIAL |
| Database/migrations | Prisma relations and schema validity; favourite uniqueness migration defined | N/A | PARTIAL | NOT APPLICABLE |

`PASS` here means request validation is wired for the listed fields and operations, not that related database behavior or every workflow has been integration-tested. `PARTIAL` reflects untested persistence/authorization journeys, missing frontend parity, incomplete form-level coverage, or the absence of concurrency/end-to-end evidence.

### Automated test commands and current results

From the API directory:

```powershell
npm run test:validation
```

This builds the TypeScript API and runs the Node built-in test runner against selected valid/invalid input cases. Latest result: **8 tests passed**.

From the repository root:

```powershell
npm test -- --watchAll=false --runInBand
npm run build
```

Latest frontend test result: **2 suites, 5 tests passed** (including the doctor signup approval popup and approval-only signup note). Latest API build and 8 backend validation tests passed. The frontend production build passed in the prior validation run. Prisma schema validation passed and the configured local database reports all migrations up to date with an empty schema diff. The Super Admin/doctor approval smoke test passed against that local database. A disposable-database migration test, password-reset/notification email delivery, browser-based full signup journey, file-upload integration, and broad patient/doctor end-to-end scenarios remain unverified.

### Adding validation to a new module

1. Define a module-local strict Zod schema for body, query, and path input, reusing shared primitives from `api/src/helpers/validation.ts`.
2. Validate and normalize input at the service boundary before database reads/writes; whitelist mutable fields instead of spreading request bodies into Prisma.
3. Keep authorization/ownership checks and database constraints in place alongside request validation.
4. Add success and invalid-input tests to `api/scripts/validation-tests.cjs`, then run `npm run test:validation` from `api`.
5. Add matching accessible frontend field errors and a focused frontend test where a user-facing form exists.
6. Update this matrix only after executing the relevant validation or integration tests; do not mark unexecuted database workflows as passing.

MediConnect retains the existing React/Express/Prisma architecture and MySQL schema. This pass strengthens authentication and ownership checks, fixes appointment/prescription/availability workflows, modernizes the login and brand surfaces, and records validation outcomes and limitations. Production release still requires end-to-end tests with seeded accounts, working email delivery, a payment provider, migration of legacy tracking IDs, and operational security controls.

---

## Module Enhancement: Email-Based Forgot Password & Reset Password (AWS Medic)

### 1. Overview
A production-grade, secure, email-based password recovery system has been implemented across the full stack (React frontend, Express/Node.js API, Prisma ORM, and MySQL database).

### 2. Architecture & Components

#### A. Frontend
* **`src/components/Login/SignIn.jsx`**:
  * Updated to include a direct "Forgot password?" link (`<Link to="/forgot-password">`) positioned below the password field.
  * Preserved full styling, accessibility tags, and brand aesthetics.
* **`src/components/Login/ForgotPasswordPage.jsx`**:
  * Created dedicated recovery route `/forgot-password`.
  * Features real-time RFC email validation, a "Send Reset Link" button with loading spinners, and an immediate "Back to Login" option.
  * Displays user-safe confirmation: `"If your email is registered, you will receive a password reset link shortly. Please check your inbox."`
* **`src/components/Login/ResetPasswordPage.jsx`**:
  * Created dedicated reset route `/reset-password` supporting `?token=...` query parameters as well as legacy URL paths.
  * Auto-validates token on mount against the backend (`POST /api/v1/auth/validate-reset-token`).
  * Shows expiration/invalid state with 1-click option to request a fresh link.
  * Features dual password fields with show/hide toggle buttons.
  * Real-time password strength meter checking all 5 criteria: 8–128 characters, uppercase, lowercase, number, and special symbol.
  * Real-time matching validation between new password and confirm password.
  * Displays `"Your password has been reset successfully. You can now log in using your new password."` upon completion and redirects to `/login` after 3 seconds.
* **`src/redux/api/authApi.js`**:
  * Added RTK Query mutations: `forgotPassword`, `validateResetToken`, `resetPasswordWithToken`.
* **`src/App.jsx`**:
  * Added client-side routes for `/forgot-password`, `/reset-password`, and backward-compatible route `/reset-password/:userId/:uniqueString`.

#### B. Backend API & Routes
* **`POST /api/v1/auth/forgot-password`**:
  * Validates email format via Zod schema.
  * Rate-limited to max 5 requests per 15 minutes per IP.
  * Silently generates tokens for existing accounts without disclosing email existence.
  * Sends an HTML email via Gmail SMTP using Handlebars template `api/template/resetPassword.html`.
* **`POST /api/v1/auth/validate-reset-token`**:
  * Verifies that the provided token exists, has not expired (15-minute window), and maps to an active user.
* **`POST /api/v1/auth/reset-password`**:
  * Validates password strength policy.
  * Hashes incoming raw token with SHA-256 and retrieves the `ForgotPassword` record.
  * Encrypts the new password using `bcrypt` (12 salt rounds).
  * Transactionally updates `Auth.password` and deletes all pending tokens for that user (strict single-use enforcement).
  * Preserves user roles, profile attributes, and doctor approval statuses.

#### C. Email Template & SMTP
* **`api/template/resetPassword.html`**:
  * Attractive, responsive, mobile-tested HTML email.
  * Branded with **AWS Medic** healthcare theme.
  * Includes personalized greeting, explanatory notice, prominent `[RESET MY PASSWORD]` button, fallback raw URL, 15-minute expiry warning, security advisory, and AWS Medic Team sign-off.
* **`api/src/helpers/emailTransporter.ts` & `Transporter.ts`**:
  * Utilizes `nodemailer` with Gmail service.
  * Supports `GMAIL_APP_EMAIL` and `EMAIL_PASS`.

### 3. Security Implementation Highlights
1. **Cryptographically Secure Entropy**: Generated with `crypto.randomBytes(32).toString('hex')` (256-bit entropy).
2. **Zero Plaintext Token Storage**: Raw tokens are never stored in the database. Only SHA-256 hex hashes are persisted in `forgot-password.uniqueString`.
3. **Strict 15-Minute Expiry**: Enforced by comparing `expiresAt` with server clock via `moment`.
4. **Single-Use Guarantee**: Used tokens and any prior tokens for the user are immediately expunged from `forgot-password` upon password update.
5. **Registered Email Verification**: Explicitly verifies the email against the database before initiating reset. Unregistered emails are rejected with HTTP 404 ("This email is not registered with any account"), preventing unauthorized or empty reset attempts.
6. **Fallback Direct Reset Link for Local Testing**: If Gmail SMTP credentials in `api/.env` are placeholder or unavailable, the backend returns the reset link directly so development and local testing are never blocked.
7. **Rate Limiting**: Custom Express middleware `api/src/app/middlewares/rateLimiter.ts` limits brute force and spam on `/forgot-password`.
8. **Role Preservation**: Password updates mutate only the password field; doctor verification status and user permissions remain untouched.

### 4. Verification & Testing
* **Integration Tests**: `api/scripts/test-password-reset.cjs` verified token generation, database SHA-256 hashing, lookup validation, expiry detection, single-use invalidation, and password restoration across 7 automated test steps.
* **ESLint**: Passed with 0 errors.
* **Frontend Production Build**: `npm run build` compiled cleanly into optimized assets.
* **Backend Build**: TypeScript `tsc` compiled with 0 errors.

---

## Module Enhancement: Clinical Diagnostic Medical Records & Radiograph Viewer

### 1. Overview
The medical reports and patient records system in AWS Medic has been upgraded from simple stock image placeholders into authentic, PACS-compliant Clinical Diagnostic Medical Records and comprehensive Laboratory Pathology Panels.

### 2. Architecture & Components

#### A. Interactive Diagnostic Report Workstation (`ClinicalReportViewer.jsx`)
* **Accredited Healthcare Letterhead**:
  * Displays certified healthcare facility branding (*Apex Radio-Diagnostic & Imaging Center* / *Apollo Clinical Diagnostics & Pathology Lab*).
  * Includes NABL / NABH accreditation, ISO 15189 certification badge, digital accession barcode, and verified final status.
* **Complete Patient Demographics**:
  * Formatted with Patient Name, Age, Gender, Patient UHID/MRN, Referring Physician, Study Date, and Authenticated Sign-out tag.
* **PACS Radiograph Lightbox Viewer**:
  * Features authentic high-resolution medical radiographs (Digital Chest X-Ray PA view, Lumbar Spine Multi-planar MRI, Abdominal USG Sonogram, 12-Lead Resting ECG Tracing).
  * Anatomical orientation indicators (`R` and `L` radiographic markers).
  * Interactive **Invert Contrast** toggle allowing clinicians to toggle between positive and negative bone/tissue radiographic contrast.
* **Systematic Clinical Observations**:
  * Organ-by-organ diagnostic breakdown (Trachea & Mediastinum, Lungs & Parenchyma, Pleural Angles, Cardiothoracic Ratio, Diaphragm, Thoracic Skeletal Cage).
  * Formal Radiologist Impression box with attending physician advisory remarks.
* **Structured Pathology Lab Tables**:
  * Interactive test parameter tables listing Investigation Analyte, Observed Result, Biological Reference Interval, Units (`g/dL`, `cells/mcL`, `mg/dL`, `%`), and Color-coded Clinical Status badges (`NORMAL`, `HIGH`, `LOW`).
* **Medical Signatures & Export**:
  * Certified digital signatures and registration numbers for attending Radiologists, Pathologists, and QA Technologists.
  * 1-Click **Print Report / Save as PDF** support formatted via print stylesheets (`@media print`).

#### B. Component Integration
* **`src/components/Patient/MedicalRecords/ImagingReports.jsx`**: Integrated `ClinicalReportViewer` for patient imaging review.
* **`src/components/Patient/MedicalRecords/LabReports.jsx`**: Integrated `ClinicalReportViewer` for patient laboratory review.
* **`src/components/Doctor/Reports/Reports.jsx`**: Integrated `ClinicalReportViewer` for doctor-side patient report inspections.

#### C. Database Updates (`api/scripts/update-real-reports.cjs`)
* Replaced generic stock photos in MySQL `MedicalReport` table with genuine clinical radiographs and scan URLs.
* Populated structured JSON `recordResults` for complete blood count panels and lipid/glycemic profiles.
* Seeded comprehensive imaging records (Chest X-Ray, Lumbar Spine MRI, Abdominal Ultrasound, 12-Lead ECG) across patients.

---

## Module Enhancement: Problem-Specific Clinical Diagnostic Report Matching & Generation

### 1. Overview
Ensures strict clinical relevance between a patient's medical complaints (e.g. chest pain, persistent cough, dyspnea) and the diagnostic reports displayed or generated. When a patient's problem is related to the chest, the platform strictly isolates and displays chest diagnostic reports (**Digital Chest X-Ray (PA View)** and **12-Lead Resting ECG**) and filters out unrelated modalities (such as Lumbar Spine MRI or Abdominal Ultrasound).

### 2. Clinical Matcher Engine (`src/utils/clinicalProblemMatcher.js`)
* **Intelligent Problem Categorization**:
  * **Chest & Respiratory**: Identifies chest pain, cough, dyspnea, bronchitis, asthma, wheezing, pneumonia, and cardiopulmonary complaints. Maps strictly to `X-Ray` (Chest PA view), `ECG/EKG`, and `Chest CT`.
  * **Spine & Orthopedic**: Identifies back pain, lumbar stiffness, sciatica, disc herniation, and radicular pain. Maps strictly to `MRI` (Lumbar Spine).
  * **Abdominal & Visceral**: Identifies abdominal ache, hepatobiliary, digestive, and renal symptoms. Maps strictly to `Ultrasound` (USG Abdomen).
  * **Blood & Metabolic**: Identifies fever, fatigue, infection, and diabetes. Maps to `CBC with ESR` and `Lipid Profile`.
* **Clinical Isolation Rules**:
  * `filterReportsByProblem(reports, problemKey)`: When `problemKey === 'CHEST'`, returns only chest-related reports and explicitly rejects unrelated spine/abdominal modalities.
  * `getGeneratorTemplateForProblem(problemKey)`: Supplies pre-filled, medically verified organ observations, clinical indications, diagnostic impressions, and authentic radiographs.

### 3. User Interface Integration
* **`ImagingReports.jsx` & `LabReports.jsx`**:
  * Prominent **Clinical Chief Complaint Filter Bar** with real-time active status (`🫁 Patient Problem: Chest & Respiratory`).
  * Table dynamically filters to show only reports matching the active complaint.
  * Upload/Generate modal includes an **Auto-Generate Valid Diagnostic Report for this Problem** button that pre-populates genuine chest radiographs and pulmonary observations.
* **`Reports.jsx` (Doctor & Patient views)**:
  * Doctor dashboard report list includes clinical chief complaint filtering.
  * Report generation workflow binds to patient complaints, automatically constraining allowed modalities to valid investigations for the complaint.
* **`ViewAppointment.jsx`**:
  * Automatically analyzes `appointment.reasonForVisit` and `appointment.description`.
  * For chest appointments, renders a dedicated **"Diagnostic Reports for this Problem"** section displaying the patient's matched Digital Chest X-Ray card with 1-click **Inspect Report** action.
  * Non-chest reports are kept hidden to avoid clinical misdirection.


