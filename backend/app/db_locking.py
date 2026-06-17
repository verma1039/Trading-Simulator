from sqlalchemy.orm import Query

from app.db import IS_SQLITE


def for_update(query: Query) -> Query:
    if IS_SQLITE:
        return query

    return query.with_for_update()
