BEGIN;

CREATE TABLE IF NOT EXISTS tracking_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT NOT NULL,
    assignment_id TEXT REFERENCES delivery_assignments (id) ON DELETE SET NULL,
    driver_id TEXT REFERENCES drivers (id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tracking_events_lat_check CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
    CONSTRAINT tracking_events_lng_check CHECK (lng IS NULL OR lng BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_order_created_at ON tracking_events (order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_assignment_id ON tracking_events (assignment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_driver_id ON tracking_events (driver_id);

COMMIT;
