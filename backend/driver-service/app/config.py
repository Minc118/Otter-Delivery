from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_ROOT = Path(__file__).resolve().parent.parent


def _env_files() -> tuple[Path, ...]:
    candidates = (SERVICE_ROOT / ".env", SERVICE_ROOT.parent.parent / ".env")
    return tuple(path for path in candidates if path.exists())


class Settings(BaseSettings):
    port: int = Field(default=8003, alias="PORT")
    driver_database_url: str | None = Field(default=None, alias="DRIVER_DATABASE_URL")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    repository_mode: str = Field(default="auto", alias="DRIVER_REPOSITORY_MODE")
    eta_minutes: int = Field(default=40, ge=1, alias="ETA_MINUTES")
    google_maps_api_key: str | None = Field(default=None, alias="GOOGLE_MAPS_API_KEY")
    google_routes_api_key: str | None = Field(default=None, alias="GOOGLE_ROUTES_API_KEY")

    model_config = SettingsConfigDict(
        env_file=_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def effective_database_url(self) -> str | None:
        return self.driver_database_url or self.database_url

    @property
    def normalized_repository_mode(self) -> str:
        mode = self.repository_mode.strip().lower()
        return mode if mode in {"auto", "memory", "postgres"} else "auto"


@lru_cache
def get_settings() -> Settings:
    return Settings()
