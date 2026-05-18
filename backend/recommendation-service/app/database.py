from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.errors import ConfigurationError


def _sqlalchemy_postgres_url(postgres_url: str) -> str:
    if postgres_url.startswith("postgresql://"):
        return postgres_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return postgres_url


@lru_cache
def get_engine():
    settings = get_settings()
    if not settings.recommendation_database_url:
        raise ConfigurationError("RECOMMENDATION_DATABASE_URL is not configured.")

    return create_engine(
        _sqlalchemy_postgres_url(settings.recommendation_database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
