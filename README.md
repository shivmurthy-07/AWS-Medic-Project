# MediConnect – Smart Healthcare & Doctor Appointment Platform

**A full-stack web app where patients book visits, doctors manage schedules and prescriptions, and admins oversee the system — all in one place.**

[Read the full technical documentation](./finaldoc.md).

[![Watch on YouTube](https://img.shields.io/badge/Watch_on-YouTube-red?logo=youtube)](https://youtu.be/L6cgb7I-Ap4)
[![Live demo — Netlify](https://img.shields.io/badge/Live_demo-Netlify-00C7B7?logo=netlify)](https://dental-doctor-ujjal.netlify.app/)

---

## In plain English: what is this?

This project is like a **small clinic website**:

- **Patients** can browse doctors, book a time that works for them, pay attention to confirmations, track an appointment with a **tracking ID**, and see prescriptions and invoices in their own area.
- **Doctors** can see who booked them, manage their **available hours**, write **prescriptions**, and keep their **profile** up to date.
- **Admins** get an overview: doctors, patients, appointments, reviews, and more (including optional **read-only “demo” admin** accounts for safe showcases).

You do **not** need to be a developer to **use** the live site. The instructions below are for people who want to **run or customize** the project on their computer.

---

## What you get (features)

| For… | What they can do |
|------|------------------|
| **Visitors** | Home, about, services, blog, contact, search and filter doctors, book appointments. |
| **Patients** | Sign up / sign in, dashboard, favourites, appointments, invoices, prescriptions, **track appointment** with ID. |
| **Doctors** | Sign up with a specialization, wait for Super Admin approval before signing in, dashboard, appointments, patients, schedule, prescriptions, reviews, blogs, invoices, profile settings. |
| **Admins** | Separate admin area: dashboard stats, manage appointments, doctors, patients, specialties, reviews, transactions. **Demo admins** (`isDemo` in database) can view everything but **cannot** change data (enforced by the API). |

**Other useful pieces**

- Email-related flows (e.g. resets, notifications) when you configure Gmail app password.
- **Cloudinary** for profile and content images.
- Modern UI (React + Ant Design) and a structured API (Node + Express + TypeScript + Prisma).

---

## Tech stack (short)

| Layer | Tools |
|-------|--------|
| **Website (frontend)** | React, Redux Toolkit, Ant Design, React Router, Axios |
| **API (backend)** | Node.js, Express, TypeScript |
| **Database** | MySQL |
| **ORM** | Prisma |

---

## Before you start (what to install)

1. **[Node.js](https://nodejs.org/)** 20 or newer — includes `npm` (Node.js 24 was used for validation).
2. A MySQL database accessible from the API.
3. Optional but recommended for full features: **Google** account (app password for mail), **Cloudinary** account (images).

You do **not** have to install Prisma or TypeScript globally — the steps below use `npx`.

---

## Project layout

```
Doctor-Appointment/          ← React app (run from here with npm start)
├── api/                     ← Backend API (Express + Prisma)
│   ├── .env.example         ← Copy to .env and fill in
│   └── prisma/
│       └── schema.prisma    ← Database models
├── .env                     ← Frontend: API URL (see below)
└── project_setup.txt        ← Short project setup checklist
```

---

## Setup guide (step by step)

### 1. Clone the repository

```bash
git clone https://github.com/Ujjalzaman/Doctor-Appointment.git
cd Doctor-Appointment
```

### 2. Create a MySQL database

Create a database and a user with access to it using your preferred local or hosted MySQL provider. Set its connection string in `api/.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

Keep the URL private and use a separate database for development and production.

### 3. Configure the backend (`api/.env`)

```bash
cd api
cp .env.example .env   # On Windows: copy .env.example .env
```

Edit **`api/.env`** and set at least:

| Variable | What to put |
|----------|-------------|
| `DATABASE_URL` | MySQL connection URL (from step 2). |
| `PORT` | e.g. `5050` (default in many setups). |
| `JWT_SECRET` / `JWT_EXPIRED_IN` | Strong private signing key and expiry (see `.env.example`). |
| `BACKEND_LOCAL_URL` | Legacy verification-link setting; not required for doctor signup or approval. |
| `BACKEND_LIVE_URL` | Legacy verification-link setting; not required for doctor signup or approval. |
| `CLIENT_LOCAL_URL` / `CLIENT_URL` | Local and deployed frontend origins. |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Optional in development. If omitted, `npm run seed:super-admin` creates username `superadmin` with a strong generated password printed once. In production, set both in `api/.env`. |
| `EMAIL_PASS` | Optional Gmail [App Password](https://support.google.com/accounts/answer/185833) for password-reset and notification emails; not needed for doctor signup. |
| `GMAIL_APP_EMAIL` / `ADMIN_EMAIL` | Optional email sender/contact addresses for password-reset and notification emails; not needed for doctor signup. |
| `CLOUND_NAME`, `API_KEY`, `API_SECRET` | From [Cloudinary](https://cloudinary.com/) dashboard. |

Install dependencies and generate Prisma Client:

```bash
npm install
npx prisma generate
```

The checked-in migrations are incremental and assume the original application tables already exist. For a new database or an existing database without Prisma migration history, back up any data, then sync the schema once:

```bash
npx prisma db push
npx prisma migrate resolve --applied 20261029_favourites_per_patient
npx prisma migrate resolve --applied 20261029_super_admin_approval
```

Only mark these migrations as applied after `db push` succeeds and the database matches `prisma/schema.prisma`. If Prisma warns about duplicate favourites, resolve those duplicates before retrying; do not blindly use `--accept-data-loss`. For databases already tracked by Prisma Migrate, use `npx prisma migrate deploy` instead. Use `migrate dev` to create future migrations in development and `migrate deploy` to apply them in deployment.

Start the API:

```bash
npm start
```

Leave this terminal running. The API should listen on the port you set (e.g. **5050**).

### 4. Configure the frontend (root `.env`)

In the **project root** (not inside `api/`), create or edit **`.env`**:

```env
REACT_APP_USE_LOCAL_API=true
REACT_APP_API_BASE_URL_LOCAL=http://localhost:5050
```

Use your real API origin in production (no trailing slash required; the app adds `/api/v1` when needed).

Install and run the website:

```bash
cd ..          # back to Doctor-Appointment root
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Admin login (important)

- Normal users sign up as **patient** or **doctor** from the app.
- **Admin** users are **not** created from the sign-up form. You add them in the **`Auth`** table in the database with `role = admin` (and a hashed password consistent with how your app stores passwords), or use your own seed script.
- For a **safe demo** for employers or clients, set **`isDemo = true`** on an admin row. That account can **browse** everything but **cannot** create, update, or delete data through the API.

### 6. Common issues

| Problem | What to try |
|---------|-------------|
| Frontend cannot reach API | Check `REACT_APP_API_BASE_URL`, CORS, and that the API is running. |
| Database connection failed | Verify the MySQL server is reachable and `DATABASE_URL` has the correct credentials, host, port, and database name. |
| Prisma errors after pulling changes | Run `npx prisma generate`; for a migration-managed database, review and apply pending migrations with `npx prisma migrate deploy`. |

---

## Video walkthrough

Older setup steps are also shown in this video; database setup may differ from this repository's current MySQL schema:

[![YouTube](https://img.shields.io/badge/Watch_on-YouTube-red?logo=youtube)](https://youtu.be/L6cgb7I-Ap4)

---

## Contributing

1. Fork the repo and clone your fork.  
2. Create a branch: `git checkout -b your-feature-name`  
3. Make changes, test with `npm start` (frontend and API, in their respective directories).
4. Commit and push, then open a **Pull Request** with a clear description.

---

Have a product idea, a similar project, or want to collaborate? Reach out via the website or email — I’m happy to hear from you.

---

## License & thanks

This repository is shared for learning and portfolio use. If you ship a public product, review dependencies’ licenses and add your own license file if needed.

Thank you for reading — and happy building.
