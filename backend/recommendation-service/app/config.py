from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = APP_DIR.parent


def _existing_env_files() -> tuple[Path, ...]:
    candidates = [
        SERVICE_ROOT / ".env",
        APP_DIR / ".env",
        Path.cwd() / ".env",
    ]
    candidates.extend(parent / ".env" for parent in SERVICE_ROOT.parents)

    env_files: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved in seen or not resolved.exists():
            continue
        seen.add(resolved)
        env_files.append(resolved)
    return tuple(env_files)


class Settings(BaseSettings):
    recommendation_database_url: str | None = Field(
        default=None,
        alias="RECOMMENDATION_DATABASE_URL",
    )
    restaurant_service_url: str = Field(
        default="http://restaurant-service:8001",
        alias="RESTAURANT_SERVICE_URL",
    )

    order_service_url: str = Field(
        default="http://order-service:8002",
        alias="ORDER_SERVICE_URL",
    )

    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    embedding_api_key: str | None = Field(default=None, alias="EMBEDDING_API_KEY")
    gemini_enabled: bool = Field(default=False, alias="GEMINI_ENABLED")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash", alias="GEMINI_MODEL")
    gemini_candidate_limit: int = Field(default=5, ge=1, le=10, alias="GEMINI_CANDIDATE_LIMIT")
    gemini_menu_item_limit: int = Field(default=3, ge=1, le=5, alias="GEMINI_MENU_ITEM_LIMIT")
    restaurant_service_timeout_seconds: float = Field(
        default=5.0,
        alias="RESTAURANT_SERVICE_TIMEOUT_SECONDS",
    )
    frontend_cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        alias="FRONTEND_CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=_existing_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
