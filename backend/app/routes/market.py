from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.schemas.common import ApiSuccessResponse, api_success
from app.services.market_data_provider import MarketDataProvider, get_market_provider
from app.services.market_status_provider import MarketStatusProvider, get_market_status_provider


router = APIRouter(prefix="/market", tags=["market"])


@router.get("/indexes", response_model=ApiSuccessResponse)
def indexes(provider: MarketDataProvider = Depends(get_market_provider)) -> dict:
    return api_success(provider.get_indexes())


@router.get("/stocks", response_model=ApiSuccessResponse)
def stocks(provider: MarketDataProvider = Depends(get_market_provider)) -> dict:
    return api_success(provider.get_stocks())


@router.get("/stocks/{symbol}", response_model=ApiSuccessResponse)
def stock(symbol: str, provider: MarketDataProvider = Depends(get_market_provider)) -> dict:
    return api_success(provider.get_stock(symbol))


@router.get("/search", response_model=ApiSuccessResponse)
def search(q: str = Query(default="", min_length=0), provider: MarketDataProvider = Depends(get_market_provider)) -> dict:
    return api_success(provider.search_stocks(q))


@router.get("/status", response_model=ApiSuccessResponse)
def market_status(provider: MarketStatusProvider = Depends(get_market_status_provider)) -> dict:
    return api_success(provider.get_status())
