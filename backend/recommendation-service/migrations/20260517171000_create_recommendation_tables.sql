CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id text PRIMARY KEY,
    language text NOT NULL DEFAULT 'en',
    dietary_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
    cuisine_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
    allergens jsonb NOT NULL DEFAULT '[]'::jsonb,
    disliked_ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
    max_price numeric(10, 2),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS recommendation_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    language text NOT NULL DEFAULT 'en',
    free_text text,
    request_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    stored_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    restaurant_service_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_requests_user_id_created_at_idx
ON recommendation_requests (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    restaurant_id text NOT NULL,
    restaurant_name text NOT NULL,
    food_item_id text NOT NULL,
    food_item_name text NOT NULL,
    price numeric(10, 2),
    currency text NOT NULL DEFAULT 'EUR',
    reason text NOT NULL,
    score numeric(7, 4),
    tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    rank integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_results_request_id_rank_idx
ON recommendation_results (request_id, rank);

CREATE INDEX IF NOT EXISTS recommendation_results_user_id_created_at_idx
ON recommendation_results (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_result_id uuid NOT NULL REFERENCES recommendation_results(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    rating integer,
    feedback_type text,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rating_between_1_and_5 CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    CONSTRAINT feedback_type_supported CHECK (
        feedback_type IS NULL
        OR feedback_type IN ('like', 'dislike', 'not_relevant', 'ordered', 'other')
    )
);

CREATE INDEX IF NOT EXISTS recommendation_feedback_result_id_idx
ON recommendation_feedback (recommendation_result_id);

CREATE INDEX IF NOT EXISTS recommendation_feedback_user_id_created_at_idx
ON recommendation_feedback (user_id, created_at DESC);
