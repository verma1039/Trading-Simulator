from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.db import Base
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

class Wallet(Base):
    __tablename__ = "wallet"
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=1_000_000.0)

class Holding(Base):
    __tablename__ = "holdings"
    symbol = Column(String, primary_key=True, index=True)
    quantity = Column(Integer)
    avg_price = Column(Float)

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    realized_pnl = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)


class CashLedger(Base):
    __tablename__ = "cash_ledger"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    symbol = Column(String, nullable=True)
    amount = Column(Float)
    balance = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

