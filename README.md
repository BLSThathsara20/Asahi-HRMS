# Asahi Group — Employee Management

A simple frontend employee management system for **Asahi Group Ltd** car dealership. Features a glassmorphism UI with light/dark gradient themes, sign-in/sign-out attendance tracking, and employee registration.

## Features

- **Authentication** — Login with role-based access (Super Admin, Admin, Manager)
- **Bootstrap setup** — First visit creates the Super Admin account when no users exist
- **User management** — Super Admin & Admin can register Manager, Admin, or Super Admin users
- **Access levels** — Per-user permission toggles for every dashboard feature
- **Department management** — Create, delete, and assign employees from the Dashboard
- **Dashboard** — Staff counts, today's attendance, department breakdown
- **Sign In / Out** — Clean clock-in UI with employee search (UK timezone)
- **Employees** — Browse and filter by department (Management, Mechanics, Marketing, Sales, Admin)
- **Register** — Add new dealership employees (Manager+ roles)
- **Theme switcher** — Light and dark gradient themes with smooth animations
- **Sanity.io** — Backend for users, employees, and attendance data

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (glassmorphism)
- Framer Motion (animations)
- React Router
- Sanity Client
- date-fns (UK locale)
- Lucide React (icons)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). On first launch you'll be prompted to create a **Super Admin** account.

## Sanity.io Setup

1. Create a project at [sanity.io](https://www.sanity.io/)
2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Add your credentials:

```env
VITE_SANITY_PROJECT_ID=your_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_TOKEN=your_write_token
```

4. Add the schemas from `sanity/schema/` to your Sanity Studio:
   - `systemUser.ts` — Login accounts with custom permissions
   - `department.ts` — Dynamic departments (Management, Mechanics, etc.)
   - `employee.ts` — Dealership employee records (references department)
   - `attendance.ts` — Sign-in/out records

5. Create an API token with **Editor** or **Administrator** permissions:
   - Go to [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**
   - Choose **Editor** (not Viewer — Viewer cannot create documents)
   - Copy the token into `.env` as `VITE_SANITY_TOKEN`

6. Add CORS origins (same API page → **CORS origins**):
   - `http://localhost:5173`
   - `http://localhost:5174`

7. Restart the dev server after updating `.env`.

## Google Sheets Integration

Attendance can be **automatically copied to a Google Sheet** every time someone signs in or out. Sanity remains the main database; the sheet is a live backup/report.

### Why this approach?

This app runs in the browser (no server). Google Sheets is connected via a **Google Apps Script web hook** — free, no extra hosting, and you own the spreadsheet.

### Step-by-step setup

#### 1. Create the spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Name it e.g. `Asahi Attendance Log`

#### 2. Add the Apps Script

1. **Extensions** → **Apps Script**
2. Delete any default code and paste the contents of:
   ```
   scripts/google-apps-script/AttendanceWebhook.gs
   ```
3. Click **Save** (name the project e.g. `Asahi Attendance Webhook`)

#### 3. Create the Attendance tab & headers

1. In Apps Script, select function **`setupAttendanceSheet`** → **Run**
2. Approve permissions when Google asks (first time only)
3. Your sheet should now have an **Attendance** tab with column headers

#### 4. Deploy as web app

1. **Deploy** → **New deployment**
2. Click the gear icon → **Web app**
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** → copy the **Web app URL** (ends with `/exec`)

#### 5. Connect the app

Add to your `.env`:

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Restart the dev server:

```bash
npm run dev
```

On the **Sign In / Out** page, Admin/Super Admin will see **Google Sheets Sync: Connected**.

### What gets saved to the sheet

Each sign-in or sign-out appends one row:

| Column | Example |
|--------|---------|
| Synced At | 09/06/2026 08:15 |
| Event | sign_in / sign_out |
| Employee ID | AG-002 |
| Name, email, department, job title | … |
| Sign in/out times (UK) | 08:15 / 16:30 |
| Status | signed_in / signed_out |
| GPS coordinates | If captured |

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Sheet not updating | Re-deploy Apps Script after code changes; use **New version** |
| CORS / network errors | Confirm URL ends with `/exec` and access is **Anyone** |
| Permission denied in script | Run `setupAttendanceSheet` again and re-authorize |
| Still not configured in app | Restart `npm run dev` after editing `.env` |

### Test the webhook

Open the web app URL in a browser — you should see:
`{"ok":true,"message":"Asahi attendance webhook is running..."}`

## Roles & Default Permissions

| Role | Register Users | Manage Access Levels | Manage Departments |
|------|---------------|---------------------|-------------------|
| **Super Admin** | ✓ All roles | ✓ Any user | ✓ |
| **Admin** | ✓ Admin, Manager | ✓ Admin & Manager | ✓ |
| **Manager** | ✗ | ✗ | ✗ (view only) |

Super Admin and Admin can customise each user's access levels on the **Users** page via **Edit Access Levels**. Permissions control:

- Dashboard widgets (stats, attendance, department chart)
- Department create / delete / assign
- Attendance sign in/out
- Employee view & register
- System user view, register & permission editing

### Auth flow

1. **No users in Sanity** → `/setup` — create the first Super Admin
2. **Users exist, not logged in** → `/login`
3. **Logged in** → features shown based on role defaults or custom permissions

## UK Conventions

- Dates displayed as `DD/MM/YYYY`
- Times in 24-hour format (`Europe/London`)
- Phone numbers in UK format

## Project Structure

```
src/
  components/     # UI and layout components
  context/        # Theme provider
  hooks/          # Data hooks
  lib/            # Sanity client, types, UK utils
  pages/          # Dashboard, Attendance, Employees, Register
sanity/schema/    # Sanity document schemas
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

Live URL (after setup): **https://blsthathsara20.github.io/Asahi-HRMS/**

Pushes to `main` deploy automatically via GitHub Actions (`.github/workflows/deploy-pages.yml`).

### One-time setup

1. **Enable Pages** — Repo → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.

2. **Add repository secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |--------|--------|
   | `VITE_SANITY_PROJECT_ID` | From your `.env` |
   | `VITE_SANITY_DATASET` | e.g. `production` |
   | `VITE_SANITY_API_VERSION` | e.g. `2024-01-01` |
   | `VITE_SANITY_TOKEN` | Sanity Developer token |
   | `VITE_GOOGLE_SHEETS_WEBHOOK_URL` | Optional — Apps Script URL |

3. **Sanity CORS** — In [sanity.io/manage](https://www.sanity.io/manage) → API → CORS origins, add:
   - `https://blsthathsara20.github.io`

4. Push to `main` (or run the workflow manually under **Actions**).

### Local production preview (same base path as Pages)

```bash
VITE_BASE_PATH=/Asahi-HRMS/ npm run build
npm run preview
```
