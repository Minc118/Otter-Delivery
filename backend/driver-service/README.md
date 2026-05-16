# driver-service

Go service for mock driver availability, location, status, and delivery ETA.

## Run Locally

```bash
go run ./cmd/server
```

The service listens on `http://localhost:8003` by default.

## Endpoints

- `GET /health`
- `GET /drivers/available`
- `POST /drivers/estimate`
- `GET /drivers/{driverId}/location`
- `PATCH /drivers/{driverId}/status`

## MVP Behavior

- Uses in-memory mock drivers.
- Returns fixed ETA: `approx. 40 min`.
- Does not integrate Google Maps yet.

## Example

```bash
curl -X POST http://localhost:8003/drivers/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rest_001",
    "customerLocation": {
      "lat": 52.5200,
      "lng": 13.4050
    }
  }'
```
