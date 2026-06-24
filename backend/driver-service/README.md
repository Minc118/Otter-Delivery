# driver-service

FastAPI service for driver availability, positions, delivery assignment, route
estimation, and order tracking. The service keeps the original Driver Service
HTTP contract and port (`8003`).

## Repository modes

- `memory`: selected when neither `DRIVER_DATABASE_URL` nor `DATABASE_URL` is
  configured. Five demo drivers are created at startup.
- `postgres`: selected when `DRIVER_DATABASE_URL` is configured. `DATABASE_URL`
  is supported only as a fallback.

The health response reports only the selected mode; it never returns connection
details or credentials.

## Local development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --host 0.0.0.0 --port 8003
```

Without database configuration, these commands run entirely in demo mode.

## API

- `GET /health`
- `GET /drivers/available`
- `GET /drivers/{driverId}`
- `GET /drivers/{driverId}/location`
- `PATCH /drivers/{driverId}/position`
- `POST /drivers/assign`
- `POST /drivers/estimate`
- `GET /orders/{orderId}/tracking`

Requests and responses use camelCase JSON for frontend compatibility. Errors use
the following shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}
```

Assignment is idempotent by `orderId`. Repeating a successful assignment returns
the existing assignment and driver without creating another tracking event.

Route estimation uses Google Routes when `GOOGLE_ROUTES_API_KEY` is configured.
Only distance, duration, and encoded route geometry are requested. If the key is
missing or the provider request fails, the service returns a deterministic mock
route instead. The API key is never included in responses or logs.

## Database migrations

The existing migrations in `migrations/` are retained unchanged. They create the
driver, assignment, tracking event, and route estimate tables, seed demo drivers,
and enable RLS. The backend connects directly to PostgreSQL and the frontend uses
only this service's REST API.

Apply migrations through the repository's established Supabase migration
workflow. Do not apply both the service-local migration set and the equivalent
root `supabase/migrations` set to a fresh database without first checking the
migration history.

## Docker

```bash
docker compose build driver-service
docker compose up driver-service
```

The Compose service starts in memory mode when no database URL is supplied.
