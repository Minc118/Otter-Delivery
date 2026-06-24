# restaurant-service

Spring Boot service for restaurant catalog, categories, and menu items.

## Environment

The service no longer stores database credentials in `application.properties`. Configure these backend-only variables in the local root `.env`, shell, Docker Compose, or deployment environment:

```bash
RESTAURANT_DATABASE_URL=
RESTAURANT_DATABASE_USERNAME=
RESTAURANT_DATABASE_PASSWORD=
RESTAURANT_SERVICE_PORT=8001
```

`DATABASE_URL` is accepted as a fallback for `RESTAURANT_DATABASE_URL`.

## Endpoints

- `GET /api/restaurants`
- `GET /api/restaurants/{id}`
- `GET /api/restaurants/open`
- `GET /api/restaurants/search?name=...`
- `PATCH /api/restaurants/{id}/status?open=true`
- `GET /api/food-items/{id}`
- `GET /api/food-items/restaurants/{restaurantId}`
- `GET /api/food-items/available`
- `GET /api/categories/restaurants/{restaurantId}`

## Demo Seed Data

Development demo data is seeded by `DemoDataSeeder` only when the Spring `dev` profile is active and `SEED_DEMO_DATA=true`.

The seeder is idempotent per demo record:

- restaurants are matched by case-insensitive name;
- categories are matched by restaurant and case-insensitive name;
- menu items are matched by category and case-insensitive name.

Existing matching demo records are updated instead of duplicated. Missing demo records are inserted, which also repairs a partially seeded catalog. Unrelated restaurants, categories, menu items, orders, and user data are not deleted.

Run with seeding enabled:

```bash
SPRING_PROFILES_ACTIVE=dev SEED_DEMO_DATA=true mvn spring-boot:run
```

Docker Compose enables both settings for `restaurant-service`, so `docker compose up --build` seeds the catalog automatically.

The demo catalog contains 12 restaurants and 60 menu items across Japanese, Korean, Turkish, Italian, Indian, Vegan, Chinese, Mexican, Thai, Middle Eastern, and Mediterranean options. Item descriptions include useful recommendation terms such as vegetarian, vegan, halal, spicy, gluten-free, warm, cheap/medium/high price signals, and comforting.

## Recommendation Integration Smoke Test

1. Start Restaurant Service with the `dev` profile and configured database.
2. Confirm catalog data:

```bash
curl http://localhost:8001/api/restaurants
curl http://localhost:8001/api/food-items/restaurants/1
```

3. Start Recommendation Service with `RESTAURANT_SERVICE_URL=http://localhost:8001`.
4. Call:

```bash
curl -X POST http://localhost:8004/recommendations/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "query": "I want something spicy and vegetarian",
    "preferences": {
      "dietary": ["vegetarian"],
      "priceRange": "medium",
      "favoriteCuisines": ["Asian"],
      "allergies": []
    }
  }'
```

The response should contain real Restaurant Service catalog recommendations and `source` should be `fallback`, `hybrid`, or `llm` depending on Gemini availability.
