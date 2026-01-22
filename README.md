# 📈 Trading Simulator: High-Frequency Full-Stack Platform

A production-grade trading simulation engine designed to replicate the architecture of modern fintech platforms. This system handles real-time market data streaming, atomic order execution, and live portfolio valuation.

---

## 🏗️ System Architecture
The application is built on a decoupled architecture focusing on low-latency updates and data integrity:

* **Backend:** FastAPI utilizing a **Multithreaded Price Engine** to poll Yahoo Finance without blocking the main event loop.
* **Real-time Layer:** State-synced WebSockets for sub-second price and P&L updates.
* **Persistence:** SQLite via SQLAlchemy for ACID-compliant trade and ledger records.
* **Frontend:** React (Vite) with custom hooks to manage WebSocket lifecycles and global state.

---

## 🚀 Key Engineering Challenges Solved

### 1. Real-Time Data Synchronization
Instead of traditional REST polling, I implemented a **WebSocket-first** approach. 
* **Challenge:** Keeping the UI in sync with volatile market prices without unnecessary re-renders.
* **Solution:** Built custom React hooks (`useLivePrices`) that manage a single socket connection, updating only the specific rows in the DOM that changed.

### 2. Atomic Order Execution
* **Challenge:** Preventing "race conditions" where a user buys more stock than their balance allows.
* **Solution:** Implemented server-side validation logic that wraps Wallet, Holdings, and Ledger updates in a single database transaction to ensure data consistency.

### 3. Background Price Engine
To avoid hitting API rate limits and blocking the UI, the backend runs a dedicated background thread that caches NASDAQ equity prices and broadcasts them to all connected clients asynchronously.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python, FastAPI, SQLAlchemy, Uvicorn, WebSockets |
| **Frontend** | React, Vite, Axios, CSS3 (Custom Modules) |
| **Data Source** | Yahoo Finance (yfinance) |
| **Database** | SQLite (Relational) |

---

## 🧠 Core Functionality

### 📊 Market & Trading
* **Live Watchlist:** Real-time price streaming for NASDAQ instruments.
* **Execution Engine:** Supports Market BUY/SELL with automated average price (LTP) recalculation.
* **Balance Guard:** Strict real-time checks for sufficient margin and existing holdings before order finalization.

### 💼 Portfolio & Wallet
* **Dynamic P&L:** Real-time calculation of Unrealized Profit/Loss based on live market spreads.
* **Financial Ledger:** A persistent record of every cash movement (Deposits, Withdrawals, Trade debits).

---

## 📂 Project Structure

```text
trading-simulator/
├── backend/
│   ├── app/
│   │   ├── routes/      # REST & WS Endpoints
│   │   ├── services/    # Price Engine & Trade Logic
│   │   └── models.py    # SQLAlchemy Schemas
│   └── trading_sim.db   # SQLite Persistent Store
└── frontend/
    ├── src/
    │   ├── hooks/       # WebSocket & API logic
    │   ├── pages/       # Dashboard, Wallet, History
    │   └── api/         # Axios configurations
```

---

## ▶️ How to Run Locally

### 1. Backend Setup

``` bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
