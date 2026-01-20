from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.services.market_data import get_live_price
from app.database import instruments

router = APIRouter()

@router.websocket("/ws/prices")
async def price_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            prices = [
                {
                    "symbol": inst["symbol"],
                    "price": round(get_live_price(inst["symbol"]), 2)
                }
                for inst in instruments
            ]

            await websocket.send_json(prices)
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        pass

    except Exception as e:
        print("Prices WS error:", e)
