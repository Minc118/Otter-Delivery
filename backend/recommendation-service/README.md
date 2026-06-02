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
GEMINI_ENABLED=false
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_CANDIDATE_LIMIT=5
GEMINI_MENU_ITEM_LIMIT=3
```

Use the Supabase Session Pooler connection string instead of the direct host if your network only supports IPv4. Do not commit real passwords or API keys.

The current implementation only requires `RECOMMENDATION_DATABASE_URL` for durable PostgreSQL/Supabase persistence. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are not used by the service code.

Gemini is optional and disabled by default for local development. Set `GEMINI_ENABLED=true` only when you want Gemini reranking. The service always performs deterministic scoring first, sends only the top compact candidates to Gemini, and falls back to deterministic ranking if Gemini is disabled, rate-limited, unavailable, returns invalid JSON, or recommends unknown restaurant IDs.

## Migrations

Run the core tables first:

```bash
cd backend/recommendation-service
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260517171000_create_recommendation_tables.sql
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260517171500_enable_recommendation_rls.sql
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260601000100_add_training_events_and_loose_feedback.sql
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260602000100_update_feedback_type_constraint.sql
psql "$RECOMMENDATION_DATABASE_URL" -f migrations/20260602000200_enable_training_events_rls.sql
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

`20260601000100_add_training_events_and_loose_feedback.sql` adds ML-ready recommendation training events and allows feedback without a persisted recommendation result id. `20260602000100_update_feedback_type_constraint.sql` updates the feedback type constraint for `clicked` and `skipped` events. `20260602000200_enable_training_events_rls.sql` enables RLS on the new training-event table. These files use idempotent `IF EXISTS` or `IF NOT EXISTS` clauses where PostgreSQL supports them.

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
- `POST /preferences`
- `PUT /preferences/{userId}`
- `POST /recommendations`
- `POST /recommendations/restaurants`
- `POST /feedback`
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

Request restaurant recommendations from the real Restaurant Service catalog, with deterministic fallback if Restaurant Service or Gemini is unavailable:

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

## Provider Boundaries

- Database access is scoped to this service's Supabase PostgreSQL tables.
- Restaurant and food item availability comes from `RESTAURANT_SERVICE_URL`.
- Gemini is optional and backend-only. Missing, disabled, rate-limited, or invalid Gemini configuration falls back to deterministic scoring. Local development can run with `GEMINI_ENABLED=false`.
- Gemini receives compact reranking input only: top candidates, at most a few menu item names, scores, matched factors, and negative factors. Full database rows and backend secrets are never sent.
- The embeddings repository is optional and unused unless `food_item_embeddings` exists and a future embedding provider is configured.
- Order Service integration is intentionally mocked behind an `OrderClient` abstraction until Order Service is stable.
