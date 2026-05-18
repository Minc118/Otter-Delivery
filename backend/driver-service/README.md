# driver-service

Go REST service for driver availability, driver positions, delivery assignment, route estimation, and order tracking.

The frontend must call this REST API only. It must not connect to Supabase PostgreSQL directly.

## Configuration

Create a `.env` file in the repository root or in `backend/driver-service`:

```bash
DRIVER_DATABASE_URL=postgresql://postgres:<password>@db.rotymfjrtkncxixmiqdr.supabase.co:5432/postgres?sslmode=require
GOOGLE_MAPS_API_KEY=
GOOGLE_ROUTES_API_KEY=
PORT=8003
ETA_MINUTES=40
```

`DRIVER_DATABASE_URL` is the preferred Driver Service database variable. `DATABASE_URL` is still supported as a fallback for deployment platforms that expose a generic database URL. The Google key variables are read by configuration now, but the real Google Maps or Routes provider is not implemented yet.

If your network cannot reach Supabase's direct database host over IPv6, use the Supabase Session Pooler URI instead and still store it in `DRIVER_DATABASE_URL`.

## Run Migrations

Preferred Supabase CLI workflow from the repository root:

```bash
supabase db push --db-url "$DRIVER_DATABASE_URL"
```

This applies the migration files in `supabase/migrations`.

Alternative direct SQL workflow from `backend/driver-service`:

```bash
psql "$DRIVER_DATABASE_URL" -f migrations/001_create_drivers.sql
psql "$DRIVER_DATABASE_URL" -f migrations/002_create_delivery_assignments.sql
psql "$DRIVER_DATABASE_URL" -f migrations/003_create_tracking_events.sql
psql "$DRIVER_DATABASE_URL" -f migrations/004_create_route_estimates.sql
psql "$DRIVER_DATABASE_URL" -f migrations/005_seed_driver_demo_data.sql
psql "$DRIVER_DATABASE_URL" -f migrations/006_enable_driver_service_rls.sql
```

You can also paste the files into the Supabase SQL editor in the same order.

The seed migration creates five demo drivers:

```sql
drv_demo_alex
drv_demo_sam
drv_demo_mina
drv_demo_noah
drv_demo_lina
```

They are used by `POST /drivers/assign` when the frontend places an order.

RLS is enabled on Driver Service tables without anon/auth policies. This keeps Supabase client access blocked; the frontend should use the Driver Service REST API only.

## Start

```bash
go run ./cmd/server
```

Default URL: `http://localhost:8003`

With Docker Compose from the repository root:

```bash
docker compose up --build driver-service
```

## Endpoints

- `GET /health`
- `GET /drivers/available`
- `GET /drivers/{driverId}`
- `PATCH /drivers/{driverId}/position`
- `POST /drivers/assign`
- `POST /drivers/estimate`
- `GET /orders/{orderId}/tracking`

## Examples

```bash
curl http://localhost:8003/drivers/available
```

```bash
curl http://localhost:8003/drivers/<driver-id>
```

```bash
curl -X PATCH http://localhost:8003/drivers/<driver-id>/position \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 52.5211,
      "lng": 13.4072
    }
  }'
```

```bash
curl -X POST http://localhost:8003/drivers/assign \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "driverId": "<driver-id>"
  }'
```

Omit `driverId` to assign the oldest available driver automatically:

```bash
curl -X POST http://localhost:8003/drivers/assign \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_124"}'
```

```bash
curl -X POST http://localhost:8003/drivers/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_125",
    "restaurantId": "rest_001",
    "pickupLocation": {
      "lat": 52.5200,
      "lng": 13.4050
    },
    "customerLocation": {
      "lat": 52.5163,
      "lng": 13.3777
    }
  }'
```

```bash
curl http://localhost:8003/orders/order_123/tracking
```

## Provider Boundaries

Route estimates are stored in PostgreSQL, but the estimate is currently produced by `MockRouteEstimator`. A real Google Maps or Google Routes implementation can be added behind the same service interface later without changing the HTTP API.

Order assignment is already live for the demo flow: after the frontend places an order, it calls `POST /drivers/assign` with the new `orderId`. The Driver Service assigns the oldest available demo driver, marks that driver as `ON_DELIVERY`, creates a delivery assignment, and writes a tracking event.
