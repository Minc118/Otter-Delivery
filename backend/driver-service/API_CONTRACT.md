# Driver Service API Contract

This contract records the Go service behavior consumed by the frontend before
the FastAPI migration. Field names remain camelCase.

| Method | Path | Success | Contract |
| --- | --- | --- | --- |
| GET | `/health` | 200 | Service status; FastAPI also adds `repositoryMode`. |
| GET | `/drivers/available` | 200 | `{ "drivers": Driver[] }` |
| GET | `/drivers/{driverId}` | 200 | `Driver`; missing driver is 404. |
| GET | `/drivers/{driverId}/location` | 200 | Current status, coordinates, and position timestamp. |
| PATCH | `/drivers/{driverId}/position` | 200 | Accepts `{ "location": { "lat", "lng" } }` or top-level coordinates and returns `Driver`. |
| POST | `/drivers/assign` | 201 | Accepts `{ "orderId", "driverId"? }`; returns `{ "assignment", "driver" }`. |
| POST | `/drivers/estimate` | 200 | Accepts customer/pickup locations and returns mock distance and ETA data. |
| GET | `/orders/{orderId}/tracking` | 200 | `{ "orderId", "assignment"?, "events": [] }`; missing data is 404. |

Assignment without `driverId` selects the oldest available driver, changes its
status to `ON_DELIVERY`, creates one assignment, and appends a
`DRIVER_ASSIGNED` event. The FastAPI implementation makes repeat requests for the
same `orderId` idempotent while preserving the success response shape.

The frontend calls assignment after Order Service creates an order. Assignment
failure does not undo the order. Tracking request failures are caught by the
tracking page, which retains its existing static display fallback.
