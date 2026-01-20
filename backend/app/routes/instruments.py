from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

from app.database import instruments
from app.services.market_data import get_live_price

router = APIRouter()


class Instrument(BaseModel):
    symbol: str
    exchange: str
    instrumentType: str
    lastTradedPrice: float


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
        item["lastTradedPrice"] = round(get_live_price(item["symbol"]), 2)
        result.append(item)

    return {
        "total": len(data),
        "page": page,
        "limit": limit,
        "items": result,
    }
