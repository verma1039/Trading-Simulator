import os
import re

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading_sim.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_SQLITE = DATABASE_URL.startswith("sqlite")
configured_schema = os.getenv("DATABASE_SCHEMA", "").strip()
DATABASE_SCHEMA = None if IS_SQLITE else configured_schema or "trading_simulator"
connect_args = (
    {"check_same_thread": False}
    if IS_SQLITE
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata = MetaData(schema=DATABASE_SCHEMA)
Base = declarative_base(metadata=metadata)


def initialize_database():
    if DATABASE_SCHEMA:
        schema_identifier = quote_identifier(DATABASE_SCHEMA)
        with engine.begin() as connection:
            connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_identifier}"))

    Base.metadata.create_all(bind=engine)


def quote_identifier(value):
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", value):
        raise ValueError(f"Invalid database schema name: {value}")

    return f'"{value}"'
