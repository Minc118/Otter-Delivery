BEGIN;

ALTER TABLE route_estimates
    ADD COLUMN IF NOT EXISTS route_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS encoded_polyline TEXT;

CREATE TABLE IF NOT EXISTS driver_tracking_snapshots (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT NOT NULL,
    assignment_id TEXT REFERENCES delivery_assignments (id) ON DELETE SET NULL,
    driver_id TEXT REFERENCES drivers (id) ON DELETE SET NULL,
    status TEXT,
    driver_lat DOUBLE PRECISION,
    driver_lng DOUBLE PRECISION,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    route_estimate_id TEXT REFERENCES route_estimates (id) ON DELETE SET NULL,
    route_provider TEXT,
    eta_seconds INTEGER,
    route_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    encoded_polyline TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT driver_tracking_snapshots_status_check CHECK (
        status IS NULL OR status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')
    ),
    CONSTRAINT driver_tracking_snapshots_driver_lat_check CHECK (driver_lat IS NULL OR driver_lat BETWEEN -90 AND 90),
    CONSTRAINT driver_tracking_snapshots_driver_lng_check CHECK (driver_lng IS NULL OR driver_lng BETWEEN -180 AND 180),
    CONSTRAINT driver_tracking_snapshots_pickup_lat_check CHECK (pickup_lat IS NULL OR pickup_lat BETWEEN -90 AND 90),
    CONSTRAINT driver_tracking_snapshots_pickup_lng_check CHECK (pickup_lng IS NULL OR pickup_lng BETWEEN -180 AND 180),
    CONSTRAINT driver_tracking_snapshots_dropoff_lat_check CHECK (dropoff_lat IS NULL OR dropoff_lat BETWEEN -90 AND 90),
    CONSTRAINT driver_tracking_snapshots_dropoff_lng_check CHECK (dropoff_lng IS NULL OR dropoff_lng BETWEEN -180 AND 180),
    CONSTRAINT driver_tracking_snapshots_eta_check CHECK (eta_seconds IS NULL OR eta_seconds > 0)
);

CREATE INDEX IF NOT EXISTS idx_driver_tracking_snapshots_order_created_at
ON driver_tracking_snapshots (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_tracking_snapshots_assignment_id
ON driver_tracking_snapshots (assignment_id);

CREATE INDEX IF NOT EXISTS idx_driver_tracking_snapshots_driver_id
ON driver_tracking_snapshots (driver_id);

CREATE TABLE IF NOT EXISTS driver_status_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT NOT NULL,
    assignment_id TEXT REFERENCES delivery_assignments (id) ON DELETE SET NULL,
    driver_id TEXT REFERENCES drivers (id) ON DELETE SET NULL,
    previous_status TEXT,
    status TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT driver_status_events_lat_check CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
    CONSTRAINT driver_status_events_lng_check CHECK (lng IS NULL OR lng BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_driver_status_events_order_created_at
ON driver_status_events (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_status_events_assignment_id
ON driver_status_events (assignment_id);

CREATE INDEX IF NOT EXISTS idx_driver_status_events_driver_id
ON driver_status_events (driver_id);

ALTER TABLE driver_tracking_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_status_events ENABLE ROW LEVEL SECURITY;

COMMIT;
