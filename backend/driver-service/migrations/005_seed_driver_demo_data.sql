BEGIN;

INSERT INTO drivers (id, name, status, current_lat, current_lng, last_position_at)
VALUES
    ('drv_demo_alex', 'Alex M.', 'AVAILABLE', 52.5200, 13.4050, now()),
    ('drv_demo_sam', 'Sam K.', 'AVAILABLE', 52.5180, 13.4090, now()),
    ('drv_demo_mina', 'Mina L.', 'AVAILABLE', 52.5224, 13.4017, now()),
    ('drv_demo_noah', 'Noah R.', 'AVAILABLE', 52.5157, 13.3901, now()),
    ('drv_demo_lina', 'Lina S.', 'AVAILABLE', 52.5260, 13.4142, now())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    current_lat = EXCLUDED.current_lat,
    current_lng = EXCLUDED.current_lng,
    last_position_at = now(),
    updated_at = now();

COMMIT;
