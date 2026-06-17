from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, foreign, relationship


SupabaseBase = declarative_base()


class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class Profile(SupabaseBase, TimestampMixin):
    __tablename__ = "profiles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    display_name = Column(String(120), nullable=True)
    role = Column(String(32), nullable=False, server_default=text("'user'"))
    status = Column(String(32), nullable=False, server_default=text("'ACTIVE'"))

    wallet = relationship(
        lambda: Wallet,
        primaryjoin=lambda: Profile.user_id == foreign(Wallet.user_id),
        uselist=False,
        viewonly=True,
    )
    holdings = relationship(
        lambda: Holding,
        primaryjoin=lambda: Profile.user_id == foreign(Holding.user_id),
        viewonly=True,
    )
    orders = relationship(
        lambda: Order,
        primaryjoin=lambda: Profile.user_id == foreign(Order.user_id),
        viewonly=True,
    )
    trades = relationship(
        lambda: Trade,
        primaryjoin=lambda: Profile.user_id == foreign(Trade.user_id),
        viewonly=True,
    )
    ledger_entries = relationship(
        lambda: CashLedger,
        primaryjoin=lambda: Profile.user_id == foreign(CashLedger.user_id),
        viewonly=True,
    )

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="ck_profiles_role"),
        CheckConstraint(
            "status IN ('ACTIVE', 'SUSPENDED', 'BANNED')",
            name="ck_profiles_status",
        ),
    )


class Wallet(SupabaseBase, TimestampMixin):
    __tablename__ = "wallets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    balance = Column(
        Numeric(14, 2),
        nullable=False,
        server_default=text("1000000.00"),
    )

    ledger_entries = relationship(
        "CashLedger",
        back_populates="wallet",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("balance >= 0", name="ck_wallets_balance_non_negative"),
    )


class Holding(SupabaseBase, TimestampMixin):
    __tablename__ = "holdings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symbol = Column(String(32), nullable=False)
    quantity = Column(Integer, nullable=False, server_default=text("0"))
    avg_price = Column(Numeric(14, 4), nullable=False, server_default=text("0"))

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_holdings_user_id_symbol"),
        CheckConstraint("quantity >= 0", name="ck_holdings_quantity_non_negative"),
        CheckConstraint("avg_price >= 0", name="ck_holdings_avg_price_non_negative"),
        Index("ix_holdings_user_id_symbol", "user_id", "symbol"),
    )


class Order(SupabaseBase, TimestampMixin):
    __tablename__ = "orders"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symbol = Column(String(32), nullable=False)
    side = Column(String(8), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(24), nullable=False, server_default=text("'PENDING'"))
    requested_price = Column(Numeric(14, 4), nullable=True)
    executed_price = Column(Numeric(14, 4), nullable=True)

    trades = relationship("Trade", back_populates="order")
    ledger_entries = relationship("CashLedger", back_populates="order")

    __table_args__ = (
        CheckConstraint("side IN ('BUY', 'SELL')", name="ck_orders_side"),
        CheckConstraint(
            "status IN ('PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED')",
            name="ck_orders_status",
        ),
        CheckConstraint("quantity > 0", name="ck_orders_quantity_positive"),
        Index("ix_orders_user_id_created_at", "user_id", "created_at"),
    )


class Trade(SupabaseBase, TimestampMixin):
    __tablename__ = "trades"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    symbol = Column(String(32), nullable=False)
    side = Column(String(8), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(14, 4), nullable=False)
    realized_pnl = Column(Numeric(14, 4), nullable=False, server_default=text("0"))

    order = relationship("Order", back_populates="trades")
    ledger_entries = relationship("CashLedger", back_populates="trade")

    __table_args__ = (
        CheckConstraint("side IN ('BUY', 'SELL')", name="ck_trades_side"),
        CheckConstraint("quantity > 0", name="ck_trades_quantity_positive"),
        CheckConstraint("price >= 0", name="ck_trades_price_non_negative"),
        Index("ix_trades_user_id_created_at", "user_id", "created_at"),
    )


class CashLedger(SupabaseBase, TimestampMixin):
    __tablename__ = "cash_ledger"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    wallet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    trade_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trades.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    entry_type = Column("type", String(40), nullable=False)
    symbol = Column(String(32), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    balance = Column(Numeric(14, 2), nullable=False)

    wallet = relationship("Wallet", back_populates="ledger_entries")
    order = relationship("Order", back_populates="ledger_entries")
    trade = relationship("Trade", back_populates="ledger_entries")

    __table_args__ = (
        CheckConstraint(
            "type IN ('DEPOSIT', 'WITHDRAW', 'TRADE_BUY', 'TRADE_SELL', 'ADJUSTMENT')",
            name="ck_cash_ledger_type",
        ),
        Index("ix_cash_ledger_user_id_created_at", "user_id", "created_at"),
    )


class AdminAction(SupabaseBase, TimestampMixin):
    __tablename__ = "admin_actions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    target_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    admin_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = Column(String(80), nullable=False)
    metadata_json = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    reason = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_admin_actions_target_user_id_created_at", "target_user_id", "created_at"),
        Index("ix_admin_actions_admin_user_id_created_at", "admin_user_id", "created_at"),
    )
