# MediConnect

MediConnect is a full-stack healthcare and doctor appointment platform. Patients can find doctors and manage appointments; doctors can manage their schedules, patient care, and profiles; administrators can oversee the platform.

## Features

- Public pages for finding doctors, services, blogs, and contact information.
- Patient accounts, doctor favourites, appointment booking and tracking, invoices, prescriptions, and medical reports.
- Doctor registration and profiles, appointment and schedule management, prescriptions, reviews, and blogs.
- Admin and Super Admin dashboards for managing users and platform activity.
- JWT-based authentication, role-aware API routes, and read-only demo-admin support.
- Image uploads through Cloudinary when configured, with a local-disk fallback.

## Architecture

```text
Browser
  └── React single-page application
        └── REST API (/api/v1)
              ├── Express + TypeScript
              ├── Prisma ORM
              └── MySQL

Image uploads ── Cloudinary (current provider) or local API disk fallback
```

In an AWS deployment, the API can run on EC2 and connect privately to RDS for MySQL. S3 can hold database backup files. **This repository does not currently upload images to S3**; using S3 for application images requires adding an S3 upload/storage implementation. See [AWS deployment](#aws-deployment) for the distinction and setup.

## Tech stack

| Area | Technologies |
|---|---|
| Frontend | React 18, JavaScript, Redux Toolkit, React Router, Ant Design, Axios |
| API | Node.js 20+, Express 4, TypeScript |
| Database | MySQL |
| Data access | Prisma ORM |
| Authentication and validation | JSON Web Tokens, bcrypt, Zod |
| Images and email | Cloudinary, Nodemailer |
| Build and tooling | Create React App, TypeScript, ESLint |

## Project structure

```text
.
├── public/                 # Static frontend assets
├── src/
│   ├── components/         # Public pages and patient, doctor, and admin UI
│   ├── helpers/            # API URL and frontend helpers
│   └── redux/              # Redux store and state
├── api/
│   ├── prisma/             # MySQL schema and migrations
│   ├── scripts/            # Seed and maintenance scripts
│   └── src/
│       ├── app/modules/    # Feature routes, controllers, services, validation
│       ├── helpers/        # Upload, email, JWT, and validation helpers
│       ├── config/         # API configuration
│       └── server.ts       # API entry point
├── Dockerfile              # Frontend container definition
├── docker-compose.yml      # Local frontend/API containers
└── package.json            # Frontend scripts and dependencies
```

## Local setup

### Prerequisites

- Node.js 20 or later and npm.
- A MySQL server. MySQL can run locally or in a development database.
- Optional: Cloudinary credentials for persistent image hosting and Gmail app-password settings for email features.

### 1. Get the code and install dependencies

```bash
git clone https://github.com/shivmurthy-07/AWS-Medic-Project.git
cd AWS-Medic-Project
npm ci
cd api
npm ci
```

Run the commands from PowerShell, Command Prompt, macOS, or Linux. The repository has separate lockfiles for the frontend and API.

### 2. Create a MySQL database

Create a database, for example `doctor_appointment`, and a MySQL user that can access it. A local MySQL shell can create the database with:

```sql
CREATE DATABASE doctor_appointment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Use the connection string format below. URL-encode special characters in the username or password.

```text
mysql://USER:PASSWORD@HOST:3306/doctor_appointment
```

### 3. Configure the API

From the `api` directory, copy the example file:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env`. Edit `api/.env` and set at least:

```dotenv
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/doctor_appointment"
NODE_ENV=development
PORT=5050
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_EXPIRED_IN=30d
CLIENT_LOCAL_URL=http://localhost:3000
```

Optional API settings:

| Variable | Purpose |
|---|---|
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary image uploads. Without working Cloudinary credentials, uploads are saved under `api/uploads`; that directory is local and is not durable storage for production. |
| `EMAIL_PASS`, `GMAIL_APP_EMAIL`, `ADMIN_EMAIL` | Email notifications and password-reset flows. Use a provider app password, not an account password. |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | Credentials for the Super Admin seed command. Set both explicitly for production. |
| `CLIENT_URL` | Deployed frontend origin; use this in production. |
| `BACKEND_LIVE_URL`, `BACKEND_LOCAL_URL` | API URL settings used by existing link and local-upload fallback code. |

The API also accepts some legacy environment-variable spellings, including `CLOUND_NAME` and `JWT_EXPIRES_IN`; prefer the names shown in `api/.env.example` and the examples above.

### 4. Prepare the database

The checked-in migrations are incremental and do not create the entire original schema from an empty database. For a **new local database**, synchronize the current Prisma schema first, then mark the two included incremental migrations as already represented:

```bash
npx prisma generate
npx prisma db push
npx prisma migrate resolve --applied 20261029_favourites_per_patient
npx prisma migrate resolve --applied 20261029_super_admin_approval
```

Run these commands from `api`. Only use this initialization sequence on a new database after confirming that `db push` completed and the database matches `api/prisma/schema.prisma`. For a database that already has valid Prisma migration history, use `npx prisma migrate deploy` instead. Back up existing data before schema changes; do not use `--accept-data-loss` to bypass a Prisma warning.

### 5. Start the API

From `api`:

```bash
npm start
```

The development API listens on `http://localhost:5050`.

To create a Super Admin, set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `api/.env`, then, from the repository root, run:

```bash
npm run seed:super-admin
```

Use a unique, strong password. Do not commit `.env` files or reuse development credentials in production.

### 6. Configure and start the frontend

Create a `.env` file in the repository root:

```dotenv
REACT_APP_USE_LOCAL_API=true
REACT_APP_API_BASE_URL_LOCAL=http://localhost:5050
```

In a second terminal, from the repository root:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). The frontend reads these `REACT_APP_*` values at build/start time; restart the frontend after changing them.

### Useful commands

| Location | Command | Purpose |
|---|---|---|
| Repository root | `npm start` | Start the React development server |
| Repository root | `npm run build` | Create the production frontend build in `build/` |
| Repository root | `npm test -- --watchAll=false` | Run frontend tests once |
| `api/` | `npm start` | Start the API in development mode |
| `api/` | `npm run build` | Compile TypeScript and copy API templates |
| `api/` | `npm test` | Build the API and run its validation tests |
| `api/` | `npx prisma generate` | Generate Prisma Client |

## AWS deployment

This guide describes a single-EC2 deployment: Nginx serves the built React app and forwards API requests to the Node API on the same instance. RDS hosts MySQL, and a private S3 bucket stores logical database backups. It assumes you have an AWS account and a domain name.

### Target architecture and current image-storage behavior

```text
Browser --HTTPS--> Nginx on EC2
                      ├── React static build
                      └── /api/v1 --> Express API on EC2:5050 (not public)
                                         ├── private MySQL connection --> RDS
                                         ├── image upload --> Cloudinary (current code)
                                         └── backup upload --> private S3 bucket (AWS CLI/IAM role)
```

The API's image helper currently integrates with Cloudinary and otherwise writes files to the API's local `uploads/` directory. **Creating an S3 bucket or attaching an IAM role alone will not make image uploads use S3.** To use S3 for images, implement and test an S3 storage adapter in the API, use the EC2 instance role with least-privilege bucket permissions, and keep the bucket private (serve images through signed URLs or an approved CDN). Until then, configure Cloudinary for production images; do not rely on EC2 local disk for durable uploads.

### 1. Create the network and security groups

Use a VPC with a public subnet for EC2 and private subnets for RDS. Create security groups with these rules:

- **EC2:** allow inbound SSH (`22`) only from your current IP while administering the instance; allow HTTP (`80`) and HTTPS (`443`) as needed. Do not expose API port `5050` publicly.
- **RDS:** allow inbound MySQL (`3306`) **only from the EC2 security group**. Keep RDS private and disable public access.

Prefer Systems Manager Session Manager over opening SSH when practical.

### 2. Create the RDS MySQL database

1. Create an RDS for MySQL instance in the same VPC and region as EC2.
2. Select private subnets and disable public access.
3. Configure its security group to accept port `3306` from the EC2 security group only.
4. Create a database and application user with only the permissions the app needs. Store the database credentials in AWS Secrets Manager.
5. Enable automated backups and choose a retention period appropriate for the service. Record the RDS endpoint, database name, user, and password securely.

The API connection string will have this form:

```text
mysql://DB_USER:URL_ENCODED_PASSWORD@RDS_ENDPOINT:3306/doctor_appointment
```

### 3. Create S3 buckets and an EC2 IAM role

Create a private S3 bucket for database backup files. Enable Block Public Access, default encryption, versioning, and a lifecycle policy that expires old backup versions according to your retention requirements.

Create an EC2 instance role and attach it to the instance (an instance profile). Grant only the required bucket/prefix permissions, such as `s3:PutObject` for the backup prefix and `s3:ListBucket` scoped to that prefix. Do not put long-lived AWS access keys in `.env` or on the instance.

If you later add S3 image uploads, use a separate media bucket and grant only the needed object operations on that bucket's specific prefix. Keep public access blocked.

### 4. Launch and prepare EC2

Launch an Amazon Linux 2023 EC2 instance in the VPC, attach the IAM role, and associate a stable public address or load balancer. Install Node.js 20+, Nginx, Git, and the MySQL client utilities needed for backups. Restrict administrative access and apply OS security updates.

Point your domain to the EC2 public address or load balancer. Configure HTTPS with a trusted certificate (for example, AWS Certificate Manager when using an Application Load Balancer, or Certbot when TLS terminates on Nginx).

### 5. Deploy the application and configure secrets

Clone the repository onto EC2, install dependencies, and build the API:

```bash
git clone https://github.com/shivmurthy-07/AWS-Medic-Project.git /opt/mediconnect
cd /opt/mediconnect/api
npm ci
npx prisma generate
npm run build
```

Create `/opt/mediconnect/api/.env` with owner-only permissions. Populate it from a secure secret-management process; do not place real secrets in shell history or source control. At minimum configure:

```dotenv
NODE_ENV=production
PORT=5050
DATABASE_URL="mysql://DB_USER:URL_ENCODED_PASSWORD@RDS_ENDPOINT:3306/doctor_appointment"
JWT_SECRET=use-a-unique-long-random-secret
JWT_REFRESH_SECRET=use-a-different-unique-long-random-secret
JWT_EXPIRED_IN=30d
CLIENT_URL=https://YOUR_DOMAIN
BACKEND_LIVE_URL=https://YOUR_DOMAIN/api/v1/auth/
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=use-a-unique-strong-password
CLOUD_NAME=your-cloudinary-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret
```

Set the `CLIENT_URL` to the exact HTTPS origin used by the browser. Cloudinary values are needed only if you use Cloudinary for production images. Keep `SHOW_ERROR_DETAILS` unset or set to `false` in production.

#### Initialize or update the RDS schema

For a **brand-new RDS database**, first verify network access from EC2 and take a backup if any data exists. Because this repository's checked-in migrations are incremental, initialize the schema from the Prisma model and then mark the included migrations as applied:

```bash
cd /opt/mediconnect/api
npx prisma db push
npx prisma migrate resolve --applied 20261029_favourites_per_patient
npx prisma migrate resolve --applied 20261029_super_admin_approval
```

Do not use this sequence on a database with existing migration history or production data without first reviewing the schema diff and taking a restorable backup. For a database already managed by Prisma Migrate, deploy reviewed migrations with:

```bash
npx prisma migrate deploy
```

Create the initial Super Admin once, using the configured production credentials:

```bash
npm run seed:super-admin
```

After confirming access, remove the bootstrap password from the deployment environment/secret if your secret-management process supports one-time bootstrap values, and rotate it if it was exposed.

### 6. Build the frontend for the production API

Create `/opt/mediconnect/.env` before building the frontend:

```dotenv
REACT_APP_USE_LOCAL_API=false
REACT_APP_API_BASE_URL_LIVE=https://YOUR_DOMAIN
```

Build and publish the static files to Nginx's document root:

```bash
cd /opt/mediconnect
npm ci
npm run build
sudo mkdir -p /var/www/mediconnect
sudo cp -r build/. /var/www/mediconnect/
```

The frontend API URL is embedded at build time. Rebuild the frontend after changing the production API URL.

### 7. Run the API as a service and configure Nginx

Run the API under a dedicated, unprivileged Linux account using `systemd` or an equivalent process supervisor. Configure its working directory as `/opt/mediconnect/api`, load the API environment securely, and restart it automatically on failure. The API currently listens on its configured port on the EC2 instance; restrict port `5050` with the host firewall and security group so only local Nginx can reach it. Do not add a public inbound rule for that port.

For example, after creating the `mediconnect` service account, create `/etc/systemd/system/mediconnect-api.service` and replace `/usr/bin/node` with the path returned by `command -v node` if necessary:

```ini
[Unit]
Description=MediConnect API
After=network.target

[Service]
Type=simple
User=mediconnect
WorkingDirectory=/opt/mediconnect/api
EnvironmentFile=/opt/mediconnect/api/.env
ExecStart=/usr/bin/node /opt/mediconnect/api/dist/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Set the environment file's ownership and permissions so only the service account and system administrator can read it. Then enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mediconnect-api
sudo systemctl status mediconnect-api
```

Configure Nginx to serve the frontend and proxy API requests to Node. For an HTTP server block (add the TLS configuration required by your certificate setup):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;
    root /var/www/mediconnect;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Validate the Nginx configuration, enable HTTPS, and verify that the frontend, API, authentication, and database connection work before directing users to the deployment.

### 8. Back up the database to S3

RDS automated backups and snapshots are the primary managed recovery mechanism. For an additional portable logical backup, install the MySQL client on EC2, create a dedicated read/backup MySQL account, and make its credentials available through a protected file or Secrets Manager integration. Do not put the database password directly in the command line.

For example, with a root-readable MySQL client option file at `/etc/mediconnect/mysql-backup.cnf` and an EC2 role allowed to write to the backup bucket:

```bash
mysqldump --defaults-extra-file=/etc/mediconnect/mysql-backup.cnf \
  --single-transaction --routines --triggers --events doctor_appointment \
  | gzip \
  | aws s3 cp - "s3://YOUR_BACKUP_BUCKET/mysql/$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
```

Run the command manually once and verify the resulting object and default encryption in S3. Then schedule it with a restricted systemd timer or cron job, log failures, and alert on missed backups. Keep RDS automated backups enabled as well; an S3 dump is not a substitute for testing RDS recovery. Periodically restore a backup into a separate test database and verify the application can read it.

## Security and operations checklist

- Keep RDS and S3 private; do not open MySQL to the internet or make a backup/media bucket public.
- Use an EC2 instance role for AWS access and Secrets Manager for database and application secrets.
- Use separate, strong JWT secrets per environment and rotate exposed credentials.
- Use HTTPS, limit EC2 inbound rules, and do not expose port `5050`.
- Configure RDS automated backup retention, S3 encryption/versioning/lifecycle, monitoring, and tested restore procedures.
- Use Cloudinary for production images until the application has a tested S3 upload implementation. Local `api/uploads` files are not durable across instance replacement.
- Review logs and alerts, patch EC2, and test deployment and database recovery before production use.

## Troubleshooting

| Symptom | Checks |
|---|---|
| Frontend cannot reach the API | Check the `REACT_APP_*` values used at build time, Nginx proxy rules, HTTPS, and API CORS `CLIENT_URL`. |
| API cannot connect to RDS | Check the RDS endpoint, URL-encoded credentials, VPC/subnets, and that RDS security group allows `3306` from the EC2 security group. |
| Prisma reports missing tables | Confirm the database/schema initialization steps and inspect migration history before applying schema changes. |
| Uploaded image links fail after redeploy | Cloudinary is not configured and the API used its local-disk fallback; configure durable image storage. |
| S3 backup upload is denied | Check the attached EC2 instance role, bucket name/region, encryption requirements, and permissions for the exact backup prefix. |

## Contributing

1. Create a feature branch.
2. Make focused changes and run the relevant frontend or API checks.
3. Open a pull request with a description of the change and its validation.
