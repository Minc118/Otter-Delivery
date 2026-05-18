BEGIN;

CREATE TABLE IF NOT EXISTS route_estimates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT,
    driver_id TEXT NOT NULL REFERENCES drivers (id) ON DELETE RESTRICT,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lng DOUBLE PRECISION NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    provider TEXT NOT NULL DEFAULT 'mock',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT route_estimates_origin_lat_check CHECK (origin_lat BETWEEN -90 AND 90),
    CONSTRAINT route_estimates_origin_lng_check CHECK (origin_lng BETWEEN -180 AND 180),
    CONSTRAINT route_estimates_destination_lat_check CHECK (destination_lat BETWEEN -90 AND 90),
    CONSTRAINT route_estimates_destination_lng_check CHECK (destination_lng BETWEEN -180 AND 180),
    CONSTRAINT route_estimates_distance_check CHECK (distance_meters >= 0),
    CONSTRAINT route_estimates_duration_check CHECK (duration_seconds > 0)
);

CREATE INDEX IF NOT EXISTS idx_route_estimates_order_created_at ON route_estimates (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_estimates_driver_id ON route_estimates (driver_id);

COMMIT;
