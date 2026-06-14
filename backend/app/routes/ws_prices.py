from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.services.market_data import get_market_status, get_symbol_market_data
from app.database import instruments

router = APIRouter()

@router.websocket("/ws/prices")
async def price_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            prices = [
                get_symbol_market_data(inst["symbol"])
                for inst in instruments
            ]

            await websocket.send_json({
                "prices": prices,
                "market": get_market_status(),
            })
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        pass

    except Exception as e:
        print("Prices WS error:", e)
