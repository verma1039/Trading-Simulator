from __future__ import annotations

from contextlib import contextmanager
from functools import lru_cache
from typing import Iterator

import psycopg
from psycopg.rows import dict_row

from app.core.exceptions import DatabaseOperationError
from app.core.config import get_settings


class Database:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    @contextmanager
    def connect(self) -> Iterator[psycopg.Connection]:
        if not self.database_url or "your-project" in self.database_url or "your-database-password" in self.database_url:
            raise DatabaseOperationError("SUPABASE_DB_URL must be configured with a real Supabase PostgreSQL connection string.")

        try:
            with psycopg.connect(self.database_url, row_factory=dict_row) as connection:
                yield connection
        except DatabaseOperationError:
            raise
        except psycopg.Error as exc:
            raise DatabaseOperationError("Database operation failed.") from exc


@lru_cache
def get_database() -> Database:
    return Database(get_settings().supabase_db_url)
