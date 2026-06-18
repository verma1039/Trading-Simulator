# Trading Simulator

Live Demo: https://real-time-trading-simulator.vercel.app/

Trading Simulator is a full-stack paper trading application with live Yahoo Finance market data, broker-style trading restrictions, portfolio tracking, wallet management, and real-time updates over WebSockets.

The application is split into a FastAPI backend and a React/Vite frontend. The backend owns market data, trading validation, persistence, and WebSocket streams. The frontend renders the market watch, order entry, portfolio, trade history, and wallet workflows.

## Features

- Live instrument watchlist backed by Yahoo Finance chart data.
- Per-symbol price freshness tracking: LIVE, DELAYED, STALE, and OFFLINE.
- Global Yahoo connectivity status based on successful update activity.
- US market-hours enforcement using the America/New_York timezone.
- Backend order rejection when market data is offline or the market is closed.
- Real-time market price stream over /ws/prices.
- Real-time portfolio valuation stream over /ws/portfolio.
- Wallet deposits, withdrawals, ledger entries, and balance tracking.
- Persistent trades, holdings, wallet, and ledger state through SQLAlchemy.
- Deployment-ready environment configuration for Railway backend, Vercel frontend, and Supabase.

## Architecture

    Yahoo Finance
         |
         v
    FastAPI market data engine
         |
         v
    In-memory price cache and freshness state
         |
         +--> REST APIs
         |
         +--> WebSocket broadcasters
                  |
                  v
             React hooks
                  |
                  v
             Market, portfolio, and trading UI

The backend starts a background price engine when FastAPI starts. That engine fetches Yahoo Finance prices, updates an in-memory cache, records timestamps, computes connectivity and freshness, and exposes the results through REST and WebSocket endpoints.

## Technology Stack

| Area | Technology |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLAlchemy, SQLite for local development, Postgres-compatible DATABASE_URL for production |
| Market data | Yahoo Finance chart API through requests |
| Real-time transport | FastAPI WebSockets |
| Frontend | React, Vite, Axios |
| Styling | Project-local CSS design system |
| Frontend deployment | Vercel |
| Backend deployment | Railway web service |

## Project Structure

    trading-simulator/
      backend/
        app/
          main.py                  FastAPI app setup, CORS, routes, startup hooks
          db.py                    SQLAlchemy engine/session configuration
          database.py              Static instrument seed data
          models.py                SQLAlchemy models
          routes/                  REST and WebSocket endpoints
          services/
            market_data.py         Yahoo fetcher, cache, freshness, market-hours logic
            price_cache.py         Price lookup compatibility helper
        requirements.txt
      frontend/
        src/
          api/                     Axios and endpoint helpers
          hooks/                   WebSocket hooks
          pages/                   Market, orders, portfolio, trades, wallet
          config.js                Frontend API and WebSocket URL configuration
        package.json
      railway.json
      vercel.json
      .env.example

## Market Data Flow

1. backend/app/services/market_data.py tracks the configured symbols and starts the price engine.
2. The price engine calls Yahoo Finance chart endpoints for each symbol.
3. Successful responses are parsed into symbol prices and timestamps.
4. Prices are stored in the backend in-memory market data cache.
5. The latest successful update time is recorded globally and per symbol.
6. REST endpoints read the cache for instruments and market status.
7. /ws/prices emits the same market data contract to connected clients.
8. React hooks consume the WebSocket payload and update page state.
9. The UI re-renders prices, badges, connectivity, freshness, and trading controls.

The application does not generate simulated fallback prices. If Yahoo Finance is unavailable, the last successfully fetched real prices remain visible and the connectivity/freshness status moves toward OFFLINE.

## Trading Flow

1. The user submits a BUY or SELL order from the frontend.
2. The frontend sends the order to POST /api/v1/orders.
3. The backend checks market connectivity and market hours.
4. The backend rejects orders when live data is unavailable or the market is closed.
5. For BUY orders, the backend checks wallet balance.
6. For SELL orders, the backend checks current holdings.
7. Valid orders update trades, holdings, wallet balance, and ledger records.
8. Portfolio and account summaries reflect the new state.

Trading is allowed only when:

- market_status is ONLINE
- market_open is true

## Market Status And Freshness

The backend maintains two related concepts:

- Connectivity status: global Yahoo Finance update availability.
- Freshness status: per-symbol age of the last successful symbol update.

Connectivity fields include:

- market_status
- market_data_available
- last_successful_update
- last_global_update
- seconds_since_last_global_update
- data_source

Per-symbol freshness fields include:

- last_updated
- age_seconds
- freshness_status

Freshness rules:

| Freshness | Rule |
| --- | --- |
| LIVE | Symbol updated within 90 seconds |
| DELAYED | Symbol updated between 90 and 180 seconds ago |
| STALE | Symbol updated more than 180 seconds ago |
| OFFLINE | Global market connectivity is OFFLINE |

Connectivity is computed from actual successful Yahoo update activity and the measured refresh interval instead of a fixed manual toggle.

## Market Hours Logic

The backend evaluates US regular market hours using the America/New_York timezone:

- Market open: 9:30 AM ET
- Market close: 4:00 PM ET
- Weekends are closed
- Daylight saving time is handled by Python timezone rules

Market status payloads expose:

- market_open
- market_open_time
- market_close_time
- next_open_time

Holiday handling is not currently implemented. For production brokerage-grade behavior, add an exchange calendar such as NYSE/Nasdaq holidays.

## Portfolio Tracking

Portfolio state combines persisted holdings with the latest available market prices:

- Holdings are persisted in the database.
- Average price is recalculated during executions.
- Current value and unrealized P/L are derived from the latest cached prices.
- /ws/portfolio streams portfolio snapshots for live UI updates.

## Order Execution

Order execution is handled by the backend only. Frontend validation improves UX, but backend validation is authoritative.

The backend enforces:

- Market connectivity must be ONLINE.
- Market must be OPEN.
- BUY orders require sufficient wallet balance.
- SELL orders require sufficient holdings.
- Cash and holding updates are persisted through SQLAlchemy models.

## Wallet Management

The wallet supports:

- Initial account balance.
- Deposits.
- Withdrawals.
- Ledger records.
- Trade debits and credits.

Wallet APIs expose current balance and ledger history.

## API Endpoints

Base path: /api/v1

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /account/summary | Account balance, holdings, and summary metrics |
| GET | /instruments | Watchlist instruments with price and freshness data |
| GET | /market/status | Connectivity, freshness, and market-hours status |
| POST | /orders | Place BUY or SELL order |
| GET | /portfolio | Current holdings and valuation |
| POST | /reset | Reset simulator state |
| GET | /trades | Trade history |
| POST | /wallet/deposit | Add wallet funds |
| POST | /wallet/withdraw | Withdraw wallet funds |
| GET | /wallet/ledger | Wallet ledger history |

## WebSocket Features

| WebSocket | Purpose |
| --- | --- |
| /ws/prices | Streams current instrument prices, per-symbol freshness, and market status |
| /ws/portfolio | Streams portfolio snapshots and live valuation |

Frontend hooks:

- frontend/src/hooks/useLivePrices.js
- frontend/src/hooks/useLivePortfolio.js

## Environment Variables

Copy .env.example and set environment-specific values in the deployment platform. Do not commit real .env files.

Backend variables:

| Variable | Required | Description |
| --- | --- | --- |
| DATABASE_URL | Production yes, local optional | SQLAlchemy database URL. Local default is sqlite:///./trading_sim.db. Use Postgres in production. |
| DATABASE_SCHEMA | Optional | Legacy local-development schema name. Supabase business tables are managed by SQL migrations. |
| FRONTEND_ORIGINS | Yes | Comma-separated frontend origins allowed by CORS. |
| SUPABASE_URL | Yes | Supabase project URL. |
| SUPABASE_JWT_ISSUER | Yes | Supabase JWT issuer, usually https://PROJECT_REF.supabase.co/auth/v1. |
| SUPABASE_JWKS_URL | Yes | Supabase JWKS URL used to validate access tokens. |
| SUPABASE_JWT_AUDIENCE | Yes | Supabase JWT audience. Defaults to authenticated. |
| SUPABASE_JWT_SECRET | Optional | Legacy fallback only. Prefer JWKS and never expose this to the frontend. |
| INITIAL_USER_BALANCE | Yes | Initial wallet balance for new users. |
| ENVIRONMENT | Yes | development, staging, or production marker. |
| ENABLE_DEV_SCHEMA_CREATE | Local only | Explicit opt-in for legacy local SQLAlchemy table creation. Keep unset or false in staging/production. |
| LOG_LEVEL | Optional | Logging level for runtime logs. |

Frontend variables:

| Variable | Required | Description |
| --- | --- | --- |
| VITE_API_BASE_URL | Yes in production | Backend REST base URL, including /api/v1. |
| VITE_WS_BASE_URL | Yes in production | Backend WebSocket base URL using wss in production. |
| VITE_SUPABASE_URL | Yes | Supabase project URL exposed to the browser. |
| VITE_SUPABASE_PUBLISHABLE_KEY | Yes | Supabase publishable/anon key exposed to the browser. |

Example local values:

    DATABASE_URL=sqlite:///./trading_sim.db
    DATABASE_SCHEMA=trading_simulator
    ENVIRONMENT=development
    ENABLE_DEV_SCHEMA_CREATE=true
    FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    SUPABASE_URL=https://your-project-ref.supabase.co
    SUPABASE_JWT_ISSUER=https://your-project-ref.supabase.co/auth/v1
    SUPABASE_JWKS_URL=https://your-project-ref.supabase.co/auth/v1/.well-known/jwks.json
    SUPABASE_JWT_AUDIENCE=authenticated
    INITIAL_USER_BALANCE=100000
    VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
    VITE_WS_BASE_URL=ws://127.0.0.1:8000
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

Example production values:

    DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres
    ENVIRONMENT=production
    ENABLE_DEV_SCHEMA_CREATE=false
    FRONTEND_ORIGINS=https://your-frontend.vercel.app
    SUPABASE_URL=https://your-project-ref.supabase.co
    SUPABASE_JWT_ISSUER=https://your-project-ref.supabase.co/auth/v1
    SUPABASE_JWKS_URL=https://your-project-ref.supabase.co/auth/v1/.well-known/jwks.json
    SUPABASE_JWT_AUDIENCE=authenticated
    INITIAL_USER_BALANCE=100000
    VITE_API_BASE_URL=https://your-railway-service.up.railway.app/api/v1
    VITE_WS_BASE_URL=wss://your-railway-service.up.railway.app
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

## Local Setup

Backend:

    cd backend
    $env:DATABASE_URL="sqlite:///./trading_sim.db"
    $env:FRONTEND_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

Frontend:

    cd frontend
    $env:VITE_API_BASE_URL="http://127.0.0.1:8000/api/v1"
    $env:VITE_WS_BASE_URL="ws://127.0.0.1:8000"
    npm install
    npm run dev

Open the Vite development URL and keep the backend running on port 8000.

## Production Build

Frontend:

    cd frontend
    $env:VITE_API_BASE_URL="http://127.0.0.1:8000/api/v1"
    $env:VITE_WS_BASE_URL="ws://127.0.0.1:8000"
    npm install
    npm run lint
    npm run build

Backend import check:

    cd backend
    $env:FRONTEND_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
    python -c "import app.main; print('backend import ok')"

Backend startup:

    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000

## Deployment Guide

Recommended production architecture:

- Frontend: Vercel static Vite deployment.
- Backend: Railway long-running FastAPI web service.
- Database: Supabase Postgres with Supabase Auth.

### Backend On Railway

1. Create a Railway service connected to this repository.
2. Use `backend` as the service root.
3. Use railway.json or configure:
   - Build command: pip install -r requirements.txt
   - Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
4. Set environment variables:
   - DATABASE_URL
   - FRONTEND_ORIGINS
   - SUPABASE_URL
   - SUPABASE_JWT_ISSUER
   - SUPABASE_JWKS_URL
   - SUPABASE_JWT_AUDIENCE=authenticated
   - INITIAL_USER_BALANCE
   - ENVIRONMENT=production
   - ENABLE_DEV_SCHEMA_CREATE=false
   - LOG_LEVEL=info
5. Use a persistent Railway deployment suitable for WebSockets and the backend price engine.
6. Deploy the backend first.
7. Confirm /api/v1/market/status responds.

### Frontend On Vercel

1. Import the repository into Vercel.
2. Set the Vercel project Root Directory to frontend.
3. Use these Vercel build settings:
   - Framework Preset: Vite
   - Install Command: npm install
   - Build Command: npm run build
   - Output Directory: dist
4. Set environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - VITE_API_BASE_URL=https://your-railway-service.up.railway.app/api/v1
   - VITE_WS_BASE_URL=wss://your-railway-service.up.railway.app
5. Deploy the frontend after the backend URL is known.
6. Add the final Vercel frontend origin to FRONTEND_ORIGINS on Railway.
7. Redeploy or restart the Railway service after changing CORS origins.

## Deployment Notes

- This backend must run as a persistent web process because it uses WebSockets, in-memory market cache, and a background Yahoo polling thread.
- Do not deploy the FastAPI backend as a serverless Vercel function.
- SQLite is suitable for local development only. Use managed Postgres for production.
- In-memory market data is refreshed after backend restarts and is not shared across multiple backend instances.
- Horizontal scaling would require shared cache/pub-sub infrastructure.

## Future Improvements

- Add an exchange holiday calendar for exact NYSE/Nasdaq closures.
- Move market cache to Redis for multi-instance deployments.
- Add structured health checks for Yahoo connectivity and scheduler status.
- Add automated backend tests for order rejection and market-hours boundaries.
- Add frontend tests for disabled trading states and WebSocket state updates.
- Add authentication and per-user portfolios if the simulator becomes multi-user.
