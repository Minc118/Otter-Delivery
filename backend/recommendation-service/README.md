# recommendation-service

Python FastAPI service for mock AI-style food recommendations.

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

The service listens on `http://localhost:8004`.

## Endpoints

- `GET /health`
- `POST /recommendations`

## MVP Behavior

- Uses local mock restaurant and dish data.
- Uses simple rule-based matching.
- Does not connect Gemini yet.
- Does not create orders.

## Example

```bash
curl -X POST http://localhost:8004/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I want something warm, vegetarian and not too expensive.",
    "language": "en",
    "dietaryPreferences": ["vegetarian"],
    "maxPrice": 15
  }'
```
