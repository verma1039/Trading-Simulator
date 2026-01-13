# backend/app/database.py

# -----------------------------
# Instruments (market reference)
# -----------------------------
instruments = [
    {"symbol": "AAPL", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "MSFT", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "GOOGL", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "AMZN", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "META", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "TSLA", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "NFLX", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "NVDA", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "INTC", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "AMD", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},

    {"symbol": "ORCL", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "IBM", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "ADBE", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "CRM", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "UBER", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "LYFT", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "SNAP", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "SHOP", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "SPOT", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "TWLO", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},

    {"symbol": "BABA", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "JD", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "PDD", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "TSM", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "QCOM", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "AVGO", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "CSCO", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "TXN", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "INTU", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "PYPL", "exchange": "NASDAQ", "instrumentType": "EQUITY", "lastTradedPrice": 0},

    {"symbol": "V", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "MA", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "JPM", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "BAC", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "WFC", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "GS", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "MS", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "AXP", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "C", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
    {"symbol": "BRK.B", "exchange": "NYSE", "instrumentType": "EQUITY", "lastTradedPrice": 0},
]

# -----------------------------
# Runtime state (hydrated later)
# -----------------------------
wallet = {"balance": 0.0}
holdings = {}
cash_ledger = []
