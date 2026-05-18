package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"otter-delivery/driver-service/internal/models"
)

var (
	ErrNotFound          = errors.New("not found")
	ErrNoAvailableDriver = errors.New("no available driver")
	ErrDriverUnavailable = errors.New("driver unavailable")
	ErrAlreadyAssigned   = errors.New("order already assigned")
)

type CreateDriverParams struct {
	Name     string
	Status   models.DriverStatus
	Location models.Location
}

type DriverRepository interface {
	CreateDriver(ctx context.Context, params CreateDriverParams) (models.Driver, error)
	ListAvailableDrivers(ctx context.Context) ([]models.Driver, error)
	GetDriverByID(ctx context.Context, driverID string) (models.Driver, error)
	UpdateDriverPosition(ctx context.Context, driverID string, location models.Location) (models.Driver, error)
	AssignDriverToOrder(ctx context.Context, orderID string, driverID string) (models.DeliveryAssignment, models.Driver, error)
	GetTrackingByOrderID(ctx context.Context, orderID string) (models.TrackingResponse, error)
	SaveRouteEstimate(ctx context.Context, estimate models.RouteEstimate) (models.RouteEstimate, error)
}

type PostgresDriverRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresDriverRepository(pool *pgxpool.Pool) *PostgresDriverRepository {
	return &PostgresDriverRepository{pool: pool}
}

func (r *PostgresDriverRepository) CreateDriver(ctx context.Context, params CreateDriverParams) (models.Driver, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO drivers (name, status, current_lat, current_lng, last_position_at)
		VALUES ($1, $2, $3, $4, now())
		RETURNING id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
	`, params.Name, params.Status, params.Location.Lat, params.Location.Lng)

	driver, err := scanDriver(row)
	if err != nil {
		return models.Driver{}, fmt.Errorf("create driver: %w", err)
	}

	return driver, nil
}

func (r *PostgresDriverRepository) ListAvailableDrivers(ctx context.Context) ([]models.Driver, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
		FROM drivers
		WHERE status = $1
		ORDER BY updated_at DESC
	`, models.DriverStatusAvailable)
	if err != nil {
		return nil, fmt.Errorf("list available drivers: %w", err)
	}
	defer rows.Close()

	drivers := make([]models.Driver, 0)
	for rows.Next() {
		driver, err := scanDriver(rows)
		if err != nil {
			return nil, fmt.Errorf("scan available driver: %w", err)
		}
		drivers = append(drivers, driver)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read available drivers: %w", err)
	}

	return drivers, nil
}

func (r *PostgresDriverRepository) GetDriverByID(ctx context.Context, driverID string) (models.Driver, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
		FROM drivers
		WHERE id = $1
	`, driverID)

	driver, err := scanDriver(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Driver{}, ErrNotFound
	}
	if err != nil {
		return models.Driver{}, fmt.Errorf("get driver: %w", err)
	}

	return driver, nil
}

func (r *PostgresDriverRepository) UpdateDriverPosition(ctx context.Context, driverID string, location models.Location) (models.Driver, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE drivers
		SET current_lat = $2,
		    current_lng = $3,
		    last_position_at = now(),
		    updated_at = now()
		WHERE id = $1
		RETURNING id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
	`, driverID, location.Lat, location.Lng)

	driver, err := scanDriver(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Driver{}, ErrNotFound
	}
	if err != nil {
		return models.Driver{}, fmt.Errorf("update driver position: %w", err)
	}

	return driver, nil
}

func (r *PostgresDriverRepository) AssignDriverToOrder(ctx context.Context, orderID string, driverID string) (models.DeliveryAssignment, models.Driver, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, fmt.Errorf("begin assignment transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	driver, err := lockDriverForAssignment(ctx, tx, driverID)
	if err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, err
	}

	if driver.Status != models.DriverStatusAvailable {
		return models.DeliveryAssignment{}, models.Driver{}, ErrDriverUnavailable
	}

	assignment, err := insertAssignment(ctx, tx, orderID, driver.DriverID)
	if err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, err
	}

	updatedDriver, err := updateDriverStatusInTx(ctx, tx, driver.DriverID, models.DriverStatusOnDelivery)
	if err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, err
	}

	if err := insertTrackingEvent(ctx, tx, assignment, updatedDriver); err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return models.DeliveryAssignment{}, models.Driver{}, fmt.Errorf("commit assignment transaction: %w", err)
	}

	return assignment, updatedDriver, nil
}

func (r *PostgresDriverRepository) GetTrackingByOrderID(ctx context.Context, orderID string) (models.TrackingResponse, error) {
	assignment, assignmentErr := getAssignmentByOrderID(ctx, r.pool, orderID)
	if assignmentErr != nil && !errors.Is(assignmentErr, ErrNotFound) {
		return models.TrackingResponse{}, assignmentErr
	}

	events, err := listTrackingEventsByOrderID(ctx, r.pool, orderID)
	if err != nil {
		return models.TrackingResponse{}, err
	}

	if assignment == nil && len(events) == 0 {
		return models.TrackingResponse{}, ErrNotFound
	}

	return models.TrackingResponse{
		OrderID:    orderID,
		Assignment: assignment,
		Events:     events,
	}, nil
}

func (r *PostgresDriverRepository) SaveRouteEstimate(ctx context.Context, estimate models.RouteEstimate) (models.RouteEstimate, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO route_estimates (
			order_id,
			driver_id,
			origin_lat,
			origin_lng,
			destination_lat,
			destination_lng,
			distance_meters,
			duration_seconds,
			provider
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, COALESCE(order_id, ''), driver_id, origin_lat, origin_lng, destination_lat, destination_lng,
		          distance_meters, duration_seconds, provider, created_at
	`, optionalString(estimate.OrderID), estimate.DriverID, estimate.OriginLocation.Lat, estimate.OriginLocation.Lng,
		estimate.DestinationLocation.Lat, estimate.DestinationLocation.Lng, estimate.DistanceMeters,
		estimate.DurationSeconds, estimate.Provider)

	saved, err := scanRouteEstimate(row)
	if err != nil {
		return models.RouteEstimate{}, fmt.Errorf("save route estimate: %w", err)
	}

	return saved, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

type queryer interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func lockDriverForAssignment(ctx context.Context, tx pgx.Tx, driverID string) (models.Driver, error) {
	if strings.TrimSpace(driverID) != "" {
		row := tx.QueryRow(ctx, `
			SELECT id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
			FROM drivers
			WHERE id = $1
			FOR UPDATE
		`, driverID)

		driver, err := scanDriver(row)
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Driver{}, ErrNotFound
		}
		if err != nil {
			return models.Driver{}, fmt.Errorf("lock driver: %w", err)
		}

		return driver, nil
	}

	row := tx.QueryRow(ctx, `
		SELECT id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
		FROM drivers
		WHERE status = $1
		ORDER BY updated_at ASC
		LIMIT 1
		FOR UPDATE SKIP LOCKED
	`, models.DriverStatusAvailable)

	driver, err := scanDriver(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Driver{}, ErrNoAvailableDriver
	}
	if err != nil {
		return models.Driver{}, fmt.Errorf("lock available driver: %w", err)
	}

	return driver, nil
}

func insertAssignment(ctx context.Context, tx pgx.Tx, orderID string, driverID string) (models.DeliveryAssignment, error) {
	row := tx.QueryRow(ctx, `
		INSERT INTO delivery_assignments (order_id, driver_id, status, assigned_at)
		VALUES ($1, $2, $3, now())
		RETURNING id, order_id, driver_id, status, assigned_at, picked_up_at, delivered_at, created_at, updated_at
	`, orderID, driverID, models.DeliveryAssignmentStatusAssigned)

	assignment, err := scanAssignment(row)
	if isUniqueViolation(err) {
		return models.DeliveryAssignment{}, ErrAlreadyAssigned
	}
	if err != nil {
		return models.DeliveryAssignment{}, fmt.Errorf("insert assignment: %w", err)
	}

	return assignment, nil
}

func updateDriverStatusInTx(ctx context.Context, tx pgx.Tx, driverID string, status models.DriverStatus) (models.Driver, error) {
	row := tx.QueryRow(ctx, `
		UPDATE drivers
		SET status = $2,
		    updated_at = now()
		WHERE id = $1
		RETURNING id, name, status, current_lat, current_lng, last_position_at, created_at, updated_at
	`, driverID, status)

	driver, err := scanDriver(row)
	if err != nil {
		return models.Driver{}, fmt.Errorf("update driver assignment status: %w", err)
	}

	return driver, nil
}

func insertTrackingEvent(ctx context.Context, tx pgx.Tx, assignment models.DeliveryAssignment, driver models.Driver) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (order_id, assignment_id, driver_id, event_type, message, lat, lng)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, assignment.OrderID, assignment.AssignmentID, driver.DriverID, "DRIVER_ASSIGNED",
		"Driver assigned to order.", driver.CurrentLocation.Lat, driver.CurrentLocation.Lng)
	if err != nil {
		return fmt.Errorf("insert assignment tracking event: %w", err)
	}

	return nil
}

func getAssignmentByOrderID(ctx context.Context, q queryer, orderID string) (*models.DeliveryAssignment, error) {
	row := q.QueryRow(ctx, `
		SELECT id, order_id, driver_id, status, assigned_at, picked_up_at, delivered_at, created_at, updated_at
		FROM delivery_assignments
		WHERE order_id = $1
		ORDER BY assigned_at DESC
		LIMIT 1
	`, orderID)

	assignment, err := scanAssignment(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get assignment tracking: %w", err)
	}

	return &assignment, nil
}

func listTrackingEventsByOrderID(ctx context.Context, q queryer, orderID string) ([]models.TrackingEvent, error) {
	rows, err := q.Query(ctx, `
		SELECT id, order_id, assignment_id, driver_id, event_type, COALESCE(message, ''), lat, lng, created_at
		FROM tracking_events
		WHERE order_id = $1
		ORDER BY created_at ASC
	`, orderID)
	if err != nil {
		return nil, fmt.Errorf("list tracking events: %w", err)
	}
	defer rows.Close()

	events := make([]models.TrackingEvent, 0)
	for rows.Next() {
		event, err := scanTrackingEvent(rows)
		if err != nil {
			return nil, fmt.Errorf("scan tracking event: %w", err)
		}
		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read tracking events: %w", err)
	}

	return events, nil
}

func scanDriver(row rowScanner) (models.Driver, error) {
	var driver models.Driver
	var status string

	err := row.Scan(
		&driver.DriverID,
		&driver.Name,
		&status,
		&driver.CurrentLocation.Lat,
		&driver.CurrentLocation.Lng,
		&driver.LastPositionAt,
		&driver.CreatedAt,
		&driver.UpdatedAt,
	)
	if err != nil {
		return models.Driver{}, err
	}

	driver.Status = models.DriverStatus(status)
	return driver, nil
}

func scanAssignment(row rowScanner) (models.DeliveryAssignment, error) {
	var assignment models.DeliveryAssignment
	var status string
	var pickedUpAt sql.NullTime
	var deliveredAt sql.NullTime

	err := row.Scan(
		&assignment.AssignmentID,
		&assignment.OrderID,
		&assignment.DriverID,
		&status,
		&assignment.AssignedAt,
		&pickedUpAt,
		&deliveredAt,
		&assignment.CreatedAt,
		&assignment.UpdatedAt,
	)
	if err != nil {
		return models.DeliveryAssignment{}, err
	}

	assignment.Status = models.DeliveryAssignmentStatus(status)
	if pickedUpAt.Valid {
		assignment.PickedUpAt = &pickedUpAt.Time
	}
	if deliveredAt.Valid {
		assignment.DeliveredAt = &deliveredAt.Time
	}

	return assignment, nil
}

func scanTrackingEvent(row rowScanner) (models.TrackingEvent, error) {
	var event models.TrackingEvent
	var assignmentID sql.NullString
	var driverID sql.NullString
	var lat sql.NullFloat64
	var lng sql.NullFloat64

	err := row.Scan(
		&event.EventID,
		&event.OrderID,
		&assignmentID,
		&driverID,
		&event.EventType,
		&event.Message,
		&lat,
		&lng,
		&event.CreatedAt,
	)
	if err != nil {
		return models.TrackingEvent{}, err
	}

	if assignmentID.Valid {
		event.AssignmentID = &assignmentID.String
	}
	if driverID.Valid {
		event.DriverID = &driverID.String
	}
	if lat.Valid && lng.Valid {
		event.Location = &models.Location{Lat: lat.Float64, Lng: lng.Float64}
	}

	return event, nil
}

func scanRouteEstimate(row rowScanner) (models.RouteEstimate, error) {
	var estimate models.RouteEstimate

	err := row.Scan(
		&estimate.EstimateID,
		&estimate.OrderID,
		&estimate.DriverID,
		&estimate.OriginLocation.Lat,
		&estimate.OriginLocation.Lng,
		&estimate.DestinationLocation.Lat,
		&estimate.DestinationLocation.Lng,
		&estimate.DistanceMeters,
		&estimate.DurationSeconds,
		&estimate.Provider,
		&estimate.CreatedAt,
	)
	if err != nil {
		return models.RouteEstimate{}, err
	}

	return estimate, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func optionalString(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}

	return trimmed
}
