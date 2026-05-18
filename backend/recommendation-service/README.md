# LLM Recommendation Service

FastAPI service for food and restaurant recommendations in Otter Delivery. The service owns its own Supabase PostgreSQL database and communicates with the Restaurant Service through REST APIs.

The current LLM implementation is a mock provider behind a service interface. It can be replaced later without changing the API or database contract.

## Environment

Create a `.env` file from the root `.env.example` or export these variables:

```bash
RECOMMENDATION_DATABASE_URL=postgresql://postgres:<YOUR-PASSWORD>@db.ilbtocodaqlseokyzyio.supabase.co:5432/postgres?sslmode=require
RESTAURANT_SERVICE_URL=http://localhost:8001
LLM_API_KEY=<provider-key-for-future-real-llm>
EMBEDDING_API_KEY=
```

Use the Supabase Session Pooler connection string instead of the direct host if your network only supports IPv4. Do not commit real passwords or API keys.

## Migrations

Run the core tables first:

```bash
cd backend/recommendation-service
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260517171000_create_recommendation_tables.sql
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260517171500_enable_recommendation_rls.sql
```

If pgvector is enabled in Supabase and embeddings are configured, run the optional migration:

```bash
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260517172000_optional_pgvector_food_item_embeddings.sql
```

The optional migration creates `food_item_embeddings`. The API does not require it for the MVP.

If you use the Supabase CLI instead of `psql`, do not run `supabase db push` from the repository root against this database because the root `supabase/migrations` directory may contain migrations for other services. Use a temporary Supabase workdir that contains only the recommendation-service migration files:

```bash
tmpdir="$(mktemp -d)"
mkdir -p "$tmpdir/supabase/migrations"
cp migrations/20260517171000_create_recommendation_tables.sql "$tmpdir/supabase/migrations/"
cp migrations/20260517171500_enable_recommendation_rls.sql "$tmpdir/supabase/migrations/"
supabase db push --db-url "$RECOMMENDATION_DATABASE_URL" --workdir "$tmpdir"
```

Copy `20260517172000_optional_pgvector_food_item_embeddings.sql` into the temporary migration directory too if you want the optional embeddings table.

## Run Locally

```bash
cd backend/recommendation-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

The service listens on `http://localhost:8004`.

## Endpoints

- `GET /health`
- `GET /preferences/{userId}`
- `PUT /preferences/{userId}`
- `POST /recommendations`
- `GET /recommendations/history/{userId}`
- `POST /recommendations/{recommendationResultId}/feedback`

## Example Requests

Create or update user preferences:

```bash
curl -X PUT http://localhost:8004/preferences/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "dietaryPreferences": ["vegetarian", "halal"],
    "cuisinePreferences": ["turkish", "korean"],
    "allergens": ["peanut"],
    "dislikedIngredients": ["cilantro"],
    "maxPrice": 18
  }'
```

Fetch preferences:

```bash
curl http://localhost:8004/preferences/user-123
```

Request recommendations:

```bash
curl -X POST http://localhost:8004/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "language": "en",
    "freeText": "I want something warm, vegetarian, and not too expensive.",
    "preferences": {
      "maxPrice": 15
    }
  }'
```

Fetch recommendation history:

```bash
curl http://localhost:8004/recommendations/history/user-123
```

Submit feedback:

```bash
curl -X POST http://localhost:8004/recommendations/<recommendationResultId>/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "rating": 5,
    "feedbackType": "like",
    "comment": "Good match for my dietary preferences."
  }'
```

## Provider Boundaries

- Database access is scoped to this service's Supabase PostgreSQL tables.
- Restaurant and food item availability comes from `RESTAURANT_SERVICE_URL`.
- The LLM provider is currently `MockLLMRecommendationProvider`.
- The embeddings repository is optional and unused unless `food_item_embeddings` exists and a future embedding provider is configured.
