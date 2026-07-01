import psycopg
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings, get_settings
from app.errors import ServiceError
from app.repositories.base import DriverRepository
from app.repositories.memory_repository import MemoryDriverRepository
from app.repositories.postgres_repository import PostgresDriverRepository
from app.routes.drivers import router as drivers_router
from app.routes.health import router as health_router
from app.routes.tracking import router as tracking_router


def create_app(
    repository: DriverRepository | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    active_settings = settings or get_settings()
    active_repository = repository or _build_repository(active_settings)

    application = FastAPI(title="Otter Delivery Driver Service", version="1.0.0")
    application.state.repository = active_repository
    application.state.settings = active_settings
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @application.exception_handler(ServiceError)
    async def service_error_handler(
        request: Request, exc: ServiceError
    ) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return _error_response(400, "INVALID_INPUT", "Invalid request input.")

    @application.exception_handler(psycopg.Error)
    async def database_error_handler(request: Request, exc: psycopg.Error) -> JSONResponse:
        return _error_response(
            500, "DATABASE_ERROR", "A Driver Service database operation failed."
        )

    application.include_router(health_router)
    application.include_router(drivers_router)
    application.include_router(tracking_router)
    return application


def _build_repository(settings: Settings) -> DriverRepository:
    if settings.normalized_repository_mode == "memory":
        return MemoryDriverRepository()
    if settings.effective_database_url:
        return PostgresDriverRepository(settings.effective_database_url)
    return MemoryDriverRepository()


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


app = create_app()
