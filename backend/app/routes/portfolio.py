from fastapi import APIRouter
from app.database import wallet, holdings
from app.services.market_data import get_live_price

router = APIRouter()

@router.get("/api/v1/portfolio")
def get_portfolio():
    portfolio_items = []
    total_invested = 0.0
    total_current_value = 0.0

    for symbol, position in holdings.items():
        quantity = position["quantity"]
        avg_price = position["avgPrice"]

        live_price = get_live_price(symbol)

        invested_value = avg_price * quantity
        current_value = live_price * quantity
        pnl = current_value - invested_value

        total_invested += invested_value
        total_current_value += current_value

        portfolio_items.append({
            "symbol": symbol,
            "quantity": quantity,
            "avgPrice": round(avg_price, 2),
            "livePrice": round(live_price, 2),
            "investedValue": round(invested_value, 2),
            "currentValue": round(current_value, 2),
            "unrealizedPnL": round(pnl, 2)
        })

    return {
        "balance": round(wallet["balance"], 2),
        "totalInvested": round(total_invested, 2),
        "totalCurrentValue": round(total_current_value, 2),
        "totalUnrealizedPnL": round(total_current_value - total_invested, 2),
        "holdings": portfolio_items
    }
