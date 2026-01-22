from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine, SessionLocal
from app import models
from app.models import Wallet, Holding
from app.database import wallet, holdings

from app.routes import (
    instruments,
    orders,
    trades,
    portfolio,
    wallet as wallet_routes,
    summary,
    ws_prices,
    ws_portfolio,
    reset,
)

from app.services.market_data import start_price_engine

# -----------------------------
# Create DB tables FIRST
# -----------------------------
models.Base.metadata.create_all(bind=engine)

# -----------------------------
# Initialize FastAPI
# -----------------------------
app = FastAPI(title="Trading Simulator API")

# -----------------------------
# START PRICE ENGINE (CORRECT WAY)
# -----------------------------
@app.on_event("startup")
def startup_event():
    start_price_engine()

# -----------------------------
# CORS (Frontend access)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Initialize DB session
# -----------------------------
db = SessionLocal()

# -----------------------------
# Initialize persistent wallet
# -----------------------------
wallet_row = db.query(Wallet).first()
if not wallet_row:
    wallet_row = Wallet(balance=1_000_000.0)
    db.add(wallet_row)
    db.commit()
    db.refresh(wallet_row)

wallet["balance"] = wallet_row.balance

# -----------------------------
# Load holdings from DB
# -----------------------------
db_holdings = db.query(Holding).all()
for h in db_holdings:
    holdings[h.symbol] = {
        "quantity": h.quantity,
        "avgPrice": h.avg_price
    }

# -----------------------------
# Register routes
# -----------------------------
app.include_router(instruments.router)
app.include_router(orders.router)
app.include_router(trades.router)
app.include_router(portfolio.router)
app.include_router(wallet_routes.router)
app.include_router(summary.router)
app.include_router(ws_prices.router)
app.include_router(ws_portfolio.router)
app.include_router(reset.router)
