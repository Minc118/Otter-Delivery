BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    last_position_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT drivers_status_check CHECK (status IN ('AVAILABLE', 'ON_DELIVERY', 'OFFLINE')),
    CONSTRAINT drivers_lat_check CHECK (current_lat BETWEEN -90 AND 90),
    CONSTRAINT drivers_lng_check CHECK (current_lng BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers (status);
CREATE INDEX IF NOT EXISTS idx_drivers_updated_at ON drivers (updated_at DESC);

COMMIT;
