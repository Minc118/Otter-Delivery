CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE recommendation_requests
    ADD COLUMN IF NOT EXISTS normalized_intent jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS recommendation_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES recommendation_requests(id) ON DELETE SET NULL,
    profile_id text,
    restaurant_id text,
    event_type text NOT NULL,
    order_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT recommendation_events_type_supported CHECK (
        event_type IN ('shown', 'click', 'order')
    )
);

CREATE INDEX IF NOT EXISTS recommendation_events_request_id_created_at_idx
ON recommendation_events (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recommendation_events_profile_id_created_at_idx
ON recommendation_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recommendation_events_restaurant_id_created_at_idx
ON recommendation_events (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recommendation_events_order_id_idx
ON recommendation_events (order_id);

ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;
