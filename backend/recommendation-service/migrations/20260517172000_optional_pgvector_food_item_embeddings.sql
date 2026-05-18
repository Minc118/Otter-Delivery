-- Optional migration. Run this only when the Supabase project has pgvector enabled.
-- The vector dimension is 1536, which matches common OpenAI text embedding models.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS food_item_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id text NOT NULL,
    food_item_id text NOT NULL UNIQUE,
    content text NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_food_item_embeddings_updated_at ON food_item_embeddings;
CREATE TRIGGER set_food_item_embeddings_updated_at
BEFORE UPDATE ON food_item_embeddings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS food_item_embeddings_food_item_id_idx
ON food_item_embeddings (food_item_id);

CREATE INDEX IF NOT EXISTS food_item_embeddings_embedding_idx
ON food_item_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ALTER TABLE food_item_embeddings ENABLE ROW LEVEL SECURITY;
