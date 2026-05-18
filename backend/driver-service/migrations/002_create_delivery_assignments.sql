BEGIN;

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

COMMIT;
