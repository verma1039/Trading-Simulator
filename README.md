# Trading Simulator

Trading Simulator is a paper-trading application with Supabase Auth, a React/Vite frontend, and a FastAPI backend backed by Supabase PostgreSQL.

## Current Scope

- Frontend: React, Vite, Tailwind CSS, shadcn/ui conventions, Recharts, and Lucide Icons.
- Backend: FastAPI routes for JWT-verified auth context, Yahoo Finance-backed market data, portfolio, transactions, orders, and admin actions.
- Auth: Supabase Auth with email/password.
- State: profiles, wallets, holdings, orders, transactions, deposit requests, and admin actions persist in Supabase PostgreSQL.
- Trading mode: simulated paper trading only. No broker integration or real-money order execution is included.

## Project Structure

~~~text
trading-simulator/
  backend/
    app/
      core/
      repositories/
      routes/
      schemas/
      services/
      main.py
    requirements.txt
  frontend/
    public/
      tradingicon.png
    src/
      components/
      layout/
      pages/
      router/
      lib/
      styles/
    package.json
    vite.config.js
  DEPLOYMENT_ENVIRONMENT_GUIDE.md
  DATABASE_MIGRATION_RUNBOOK.md
  RELEASE_READINESS_CHECKLIST.md
~~~

## Local Startup

### 1. Install Frontend Dependencies

~~~powershell
cd frontend
npm install
~~~

### 2. Install Backend Dependencies

~~~powershell
cd backend
python -m pip install -r requirements.txt
~~~

### 3. Configure Environment

Use the root environment template as the local reference.

Backend environment is loaded from:

~~~text
backend/.env
~~~

Frontend environment is loaded from:

~~~text
frontend/.env
~~~

Required local values:

~~~env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_DB_URL=
ADMIN_EMAIL=
JOINING_BONUS_AMOUNT=10000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://127.0.0.1:8000
~~~

Apply database migrations in order before using protected routes:

~~~text
backend/migrations/supabase/004_business_persistence.up.sql
backend/migrations/supabase/005_profile_completion.up.sql
backend/migrations/supabase/006_profile_hardening.up.sql
backend/migrations/supabase/007_production_index_audit.up.sql
backend/migrations/supabase/008_signup_profile_unification.up.sql
~~~

### 4. Start Backend

~~~powershell
cd backend
python -m uvicorn app.main:app --reload
~~~

Alternative port:

~~~powershell
cd backend
python -m uvicorn app.main:app --reload --port 8001
~~~

Optional local runner with env-based port override:

~~~powershell
cd backend
$env:BACKEND_PORT="8001"
python run.py
~~~

The runner checks the configured port before starting and prints a clear message if the port is already in use.

### 5. Start Frontend

~~~powershell
cd frontend
npm run dev
~~~

Open:

~~~text
http://localhost:5173/login
~~~

## Troubleshooting

### Port Already In Use

If backend startup fails because port `8000` is already occupied, start on another port:

~~~powershell
cd backend
python -m uvicorn app.main:app --reload --port 8001
~~~

Then update frontend `VITE_API_BASE_URL`:

~~~env
VITE_API_BASE_URL=http://127.0.0.1:8001
~~~

### Supabase Configuration Missing

If startup fails with missing configuration, check `backend/.env` for:

~~~env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_DB_URL=
ADMIN_EMAIL=
~~~

The backend intentionally fails fast when required values are missing or still use unconfigured template values.

### Database Connection Failures

If API requests return `Database operation failed.`, verify:

- `SUPABASE_DB_URL` is a real Supabase PostgreSQL connection string.
- the database password is correct.
- migrations `004` through `008` have been applied.
- the Supabase database is reachable from your machine.

### Yahoo Finance Data Failures

If market endpoints fail, retry after a short delay. The backend caches successful Yahoo Finance responses and falls back to cached data when possible.

## Local Login Flow

- Open `http://localhost:5173/login`.
- User accounts are created through Supabase Auth from `http://localhost:5173/signup` with full name, email, password, mobile number, and date of birth, then redirect to `/login`.
- If Supabase email confirmation is enabled, confirm the account before logging in.
- After login, normal users go directly to `/user`; admins go directly to `/admin`.
- On first user login, the wallet is created and a one-time `$10,000` joining bonus is credited.
- On first profile creation, authenticated email matching `ADMIN_EMAIL` becomes `ADMIN`; all other authenticated users become `USER`.
- After profile creation, `profiles.role` is the source of truth.
- To change an existing admin/user role after creation, update `profiles.role` in Supabase PostgreSQL.
