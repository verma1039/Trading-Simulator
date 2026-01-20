# 📈 Trading Simulator

A personal stock trading simulator built to explore the systems engineering and real-time data flow of modern trading platforms. This project focuses on the interaction between market data, order execution, and portfolio management.

---

## ✨ Key Features

### 📡 Real-Time Data Flow
- **WebSocket Price Streaming:** Backend exposes a live endpoint at `ws://localhost:8000/ws/prices`.
- **Live Updates:** The frontend subscribes to real-time price updates, eliminating the need for polling.
- **Placeholder Infrastructure:** Currently uses simulated market data, designed for easy integration with real-world APIs.

### 💹 Trading Capabilities
- **Order Management:** Supports virtual **BUY** and **SELL** orders via REST APIs.
- **Instant Execution:** Orders are executed immediately based on current market price logic.
- **Instrument Tracking:** Fetches a curated list of tradable stocks (symbol, exchange, type) from the backend.

### 📁 Portfolio & History
- **Live Portfolio:** Automatically updates holdings and state after every trade.
- **Trade History:** Keeps an in-memory log of every executed order for audit and review.

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Uvicorn (WebSockets & REST)
- **Frontend:** React, Vite, Axios, Native WebSocket API
- **Data:** In-memory state management (Current focus on systems logic over persistence)

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app
