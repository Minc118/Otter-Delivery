from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVICE_ROOT.parents[1]


class Settings(BaseSettings):
    recommendation_database_url: str | None = Field(
        default=None,
        alias="RECOMMENDATION_DATABASE_URL",
    )
    restaurant_service_url: str = Field(
        default="http://restaurant-service:8001",
        alias="RESTAURANT_SERVICE_URL",
    )
    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    embedding_api_key: str | None = Field(default=None, alias="EMBEDDING_API_KEY")
    restaurant_service_timeout_seconds: float = Field(
        default=5.0,
        alias="RESTAURANT_SERVICE_TIMEOUT_SECONDS",
    )

    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", SERVICE_ROOT / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
