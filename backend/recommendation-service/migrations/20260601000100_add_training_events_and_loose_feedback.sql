CREATE TABLE IF NOT EXISTS recommendation_training_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES recommendation_requests(id) ON DELETE SET NULL,
    user_id text NOT NULL,
    query text,
    candidate_restaurant_id text NOT NULL,
    recommendation_score numeric(10, 4) NOT NULL,
    completion_score numeric(7, 4) NOT NULL,
    training_loss_proxy numeric(7, 4) NOT NULL,
    matched_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
    negative_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
    feature_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    source text NOT NULL DEFAULT 'fallback',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendation_training_events_user_id_created_at_idx
ON recommendation_training_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS recommendation_training_events_restaurant_idx
ON recommendation_training_events (candidate_restaurant_id);

CREATE INDEX IF NOT EXISTS recommendation_training_events_request_id_idx
ON recommendation_training_events (request_id);

ALTER TABLE recommendation_feedback
    ALTER COLUMN recommendation_result_id DROP NOT NULL;

ALTER TABLE recommendation_feedback
    ADD COLUMN IF NOT EXISTS restaurant_id text;

CREATE INDEX IF NOT EXISTS recommendation_feedback_restaurant_id_idx
ON recommendation_feedback (restaurant_id);
