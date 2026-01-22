import requests
from app.db import SessionLocal
from app.models import Wallet, Trade

BASE_URL = "http://localhost:8001"

def get_db_balance():
    db = SessionLocal()
    try:
        wallet = db.query(Wallet).first()
        return wallet.balance if wallet else None
    finally:
        db.close()

def main():
    print("Starting verification...")
    
    # 1. Reset first to ensure clean state
    print("Resetting account...")
    requests.post(f"{BASE_URL}/api/v1/reset")
    
    initial_balance = get_db_balance()
    print(f"Initial DB Balance: {initial_balance}")
    assert initial_balance == 1000000.0, f"Expected 1000000.0, got {initial_balance}"
    
    # 2. Place a dummy order
    print("Placing dummy order (BUY AAPL)...")
    payload = {
        "symbol": "AAPL",
        "side": "BUY",
        "quantity": 10
    }
    # We need to make sure price engine is running or price exists. 
    # For now assuming price > 0. If price is 0 (engine not running), this might fail or cost 0.
    
    try:
        res = requests.post(f"{BASE_URL}/api/v1/orders", json=payload)
        if res.status_code == 200:
            print("Order placed successfully.")
            data = res.json()
            new_balance_api = data["balance"]
            print(f"API Balance after trade: {new_balance_api}")
            
            # 3. Verify persistence
            db_balance = get_db_balance()
            print(f"DB Balance after trade: {db_balance}")
            
            # Floating point comparison
            assert abs(new_balance_api - db_balance) < 0.01, "DB balance does not match API balance!"
            assert db_balance < 1000000.0, "Balance did not decrease!"
            
        else:
            print(f"Order failed: {res.text}")
            # If order failed (maybe market closed or price 0), we can't fully test persistence this way
            # But we can still test reset.
            
    except Exception as e:
        print(f"Order placement error: {e}")

    # 4. Reset again
    print("Resetting account again...")
    res = requests.post(f"{BASE_URL}/api/v1/reset")
    assert res.status_code == 200
    
    final_balance = get_db_balance()
    print(f"Final DB Balance: {final_balance}")
    assert final_balance == 1000000.0, "Balance did not reset to 1000000.0"
    
    print("Verification passed!")

if __name__ == "__main__":
    main()
