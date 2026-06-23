from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings


def _sqlalchemy_postgres_url(postgres_url: str) -> str:
    if postgres_url.startswith("postgresql://"):
        return postgres_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return postgres_url


@lru_cache
def get_engine():
    settings = get_settings()
    if not settings.recommendation_database_url:
        return None

    return create_engine(
        _sqlalchemy_postgres_url(settings.recommendation_database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session] | None:
    engine = get_engine()
    if engine is None:
        return None
    return sessionmaker(bind=engine, expire_on_commit=False)


def get_db() -> Generator[Session | None, None, None]:
    session_factory = get_session_factory()
    if session_factory is None:
        yield None
        return

    db = session_factory()
    try:
        yield db
    finally:
        db.close()
