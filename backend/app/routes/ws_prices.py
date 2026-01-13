from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from app.services.market_prices import get_all_prices

router = APIRouter()


@router.websocket("/ws/prices")
async def prices_ws(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            prices = get_all_prices()
            await websocket.send_json(prices)
            await asyncio.sleep(1)  # push every second
    except WebSocketDisconnect:
        pass

