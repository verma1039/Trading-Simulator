from fastapi import APIRouter, HTTPException
from app.db import SessionLocal
from app.models import Wallet, Holding, Trade, CashLedger
from app.database import wallet, holdings, cash_ledger

router = APIRouter()

@router.post("/api/v1/reset")
def reset_account():
    db = SessionLocal()
    try:
        # Delete all data
        db.query(Trade).delete()
        db.query(CashLedger).delete()
        db.query(Holding).delete()
        
        # Reset wallet
        wallet_row = db.query(Wallet).first()
        if wallet_row:
            wallet_row.balance = 1_000_000.0
            db.add(wallet_row)
        else:
            # Should exist, but just in case
            wallet_row = Wallet(balance=1_000_000.0)
            db.add(wallet_row)
            
        db.commit()
        
        # Reset in-memory state
        wallet["balance"] = 1_000_000.0
        holdings.clear()
        cash_ledger.clear()
        
        return {"status": "RESET_COMPLETE", "balance": 1_000_000.0}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
