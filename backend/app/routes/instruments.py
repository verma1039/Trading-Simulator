from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

from app.database import instruments
from app.services.market_data import get_market_status, get_symbol_market_data

router = APIRouter()


class Instrument(BaseModel):
    symbol: str
    exchange: str
    instrumentType: str
    lastTradedPrice: float
    price: float
    last_updated: Optional[str] = None
    age_seconds: Optional[int] = None
    freshness_status: str


class InstrumentsResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[Instrument]


@router.get("/api/v1/instruments", response_model=InstrumentsResponse)
def get_instruments(
    q: Optional[str] = None,
    page: int = 1,
    limit: int = Query(50, le=100),
):
    data = instruments

    if q:
        data = [i for i in data if q.lower() in i["symbol"].lower()]

    start = (page - 1) * limit
    end = start + limit
    page_items = data[start:end]

    result = []
    for i in page_items:
        item = i.copy()
        symbol_data = get_symbol_market_data(item["symbol"])
        item["lastTradedPrice"] = symbol_data["price"]
        item.update(symbol_data)
        result.append(item)

    return {
        "total": len(data),
        "page": page,
        "limit": limit,
        "items": result,
    }


@router.get("/api/v1/market/status")
def market_status():
    return get_market_status()
