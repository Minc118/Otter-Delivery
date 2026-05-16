# order-service

Placeholder for the teammate-owned order service.

Suggested implementation:

- Java / Spring Boot
- REST JSON APIs
- Docker service name: `order-service`
- Planned port: `8002`

Responsibilities:

- Order preview
- Order creation
- Order success data
- Order tracking data
- Order history
- Order status transitions
- Restaurant-grouped checkout
- Mock payment for MVP

Planned endpoints:

- `GET /health`
- `POST /orders/preview`
- `POST /orders`
- `GET /orders/{orderId}`
- `GET /orders/{orderId}/tracking`
- `GET /orders/history`
- `PATCH /orders/{orderId}/status`

No implementation is included here yet.
