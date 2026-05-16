# auth-service

Placeholder for the teammate-owned authentication service or Keycloak setup.

Suggested implementation:

- Java / Spring Boot or Keycloak
- REST JSON APIs where applicable
- Docker service name: `auth-service` or `keycloak`
- Planned port: `8080`

Responsibilities:

- Login
- Registration
- Current user identity
- Logout
- Future JWT validation
- Future Keycloak realm/client configuration

Planned endpoints for a simple auth facade:

- `GET /health`
- `GET /auth/me`
- `POST /auth/logout`

No implementation is included here yet.
