import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes import (
    admin,
    auth,
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

load_dotenv()


def get_cors_origins():
    return [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]


def is_dev_schema_create_enabled():
    environment = os.getenv("ENVIRONMENT", "").lower()
    enabled = os.getenv("ENABLE_DEV_SCHEMA_CREATE", "").lower()
    return environment == "development" and enabled in {"1", "true", "yes", "on"}


def initialize_development_database():
    if not is_dev_schema_create_enabled():
        return

    from app.db import initialize_database

    # Legacy SQLAlchemy table creation is explicit local-development only.
    from app import models  # noqa: F401

    initialize_database()


initialize_development_database()

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
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Register routes
# -----------------------------
app.include_router(instruments.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(orders.router)
app.include_router(trades.router)
app.include_router(portfolio.router)
app.include_router(wallet_routes.router)
app.include_router(summary.router)
app.include_router(ws_prices.router)
app.include_router(ws_portfolio.router)
app.include_router(reset.router)
