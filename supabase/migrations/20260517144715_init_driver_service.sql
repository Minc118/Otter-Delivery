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

CREATE TABLE IF NOT EXISTS delivery_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT NOT NULL,
    driver_id TEXT NOT NULL REFERENCES drivers (id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'ASSIGNED',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT delivery_assignments_order_unique UNIQUE (order_id),
    CONSTRAINT delivery_assignments_status_check CHECK (
        status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')
    )
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver_id ON delivery_assignments (driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments (order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments (status);

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
