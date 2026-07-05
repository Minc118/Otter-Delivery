import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.repositories.memory_repository import MemoryDriverRepository


@pytest.fixture
def repository() -> MemoryDriverRepository:
    return MemoryDriverRepository()


@pytest.fixture
def client(repository: MemoryDriverRepository) -> TestClient:
    settings = Settings(
        DRIVER_DATABASE_URL=None,
        DATABASE_URL=None,
        GOOGLE_ROUTES_API_KEY=None,
        GOOGLE_MAPS_API_KEY=None,
        ETA_MINUTES=40,
    )
    with TestClient(create_app(repository=repository, settings=settings)) as test_client:
        yield test_client
