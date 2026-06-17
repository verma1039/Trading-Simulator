from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth.config import get_auth_settings
from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.db_locking import for_update
from app.supabase_models import CashLedger, Holding, Order, Profile, Trade, Wallet

router = APIRouter()


@router.post("/api/v1/reset")
def reset_account(current_user: CurrentUser = Depends(get_current_user)):
    user_id = UUID(current_user.id)
    initial_balance = Decimal(str(get_auth_settings().initial_user_balance))
    db = SessionLocal()

    try:
        for_update(
            db.query(Profile).filter(Profile.user_id == user_id)
        ).first()

        wallet_row = for_update(
            db.query(Wallet).filter(Wallet.user_id == user_id)
        ).first()

        db.query(CashLedger).filter(CashLedger.user_id == user_id).delete(
            synchronize_session=False,
        )
        db.query(Trade).filter(Trade.user_id == user_id).delete(
            synchronize_session=False,
        )
        db.query(Order).filter(Order.user_id == user_id).delete(
            synchronize_session=False,
        )
        db.query(Holding).filter(Holding.user_id == user_id).delete(
            synchronize_session=False,
        )

        if wallet_row:
            wallet_row.balance = initial_balance
            db.add(wallet_row)
        else:
            wallet_row = Wallet(
                user_id=user_id,
                balance=initial_balance,
            )
            db.add(wallet_row)

        db.commit()
        return {"status": "RESET_COMPLETE", "balance": round(float(initial_balance), 2)}

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to reset account") from exc
    finally:
        db.close()
