from fastapi import FastAPI

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
)

# -----------------------------
# Create DB tables FIRST
# -----------------------------
models.Base.metadata.create_all(bind=engine)

# -----------------------------
# Initialize FastAPI
# -----------------------------
app = FastAPI(title="Trading Simulator API")

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
