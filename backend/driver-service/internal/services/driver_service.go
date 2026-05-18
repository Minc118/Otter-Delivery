package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"otter-delivery/driver-service/internal/models"
	"otter-delivery/driver-service/internal/repository"
)

type ValidationError struct {
	Message string
}

func (e ValidationError) Error() string {
	return e.Message
}

type DriverService struct {
	repo      repository.DriverRepository
	estimator RouteEstimator
}

func NewDriverService(repo repository.DriverRepository, estimator RouteEstimator) *DriverService {
	return &DriverService{
		repo:      repo,
		estimator: estimator,
	}
}

func (s *DriverService) CreateDriver(ctx context.Context, request models.CreateDriverRequest) (models.Driver, error) {
	name := strings.TrimSpace(request.Name)
	if name == "" {
		return models.Driver{}, ValidationError{Message: "Driver name is required."}
	}

	status := request.Status
	if status == "" {
		status = models.DriverStatusAvailable
	}
	if !isValidDriverStatus(status) {
		return models.Driver{}, ValidationError{Message: "Driver status must be AVAILABLE, ON_DELIVERY, or OFFLINE."}
	}

	if request.CurrentLocation == nil || !isValidLocation(*request.CurrentLocation) {
		return models.Driver{}, ValidationError{Message: "Current location must include a valid latitude and longitude."}
	}

	return s.repo.CreateDriver(ctx, repository.CreateDriverParams{
		Name:     name,
		Status:   status,
		Location: *request.CurrentLocation,
	})
}

func (s *DriverService) AvailableDrivers(ctx context.Context) ([]models.Driver, error) {
	return s.repo.ListAvailableDrivers(ctx)
}

func (s *DriverService) GetDriverByID(ctx context.Context, driverID string) (models.Driver, error) {
	driverID = strings.TrimSpace(driverID)
	if driverID == "" {
		return models.Driver{}, ValidationError{Message: "Driver ID is required."}
	}

	return s.repo.GetDriverByID(ctx, driverID)
}

func (s *DriverService) UpdateDriverPosition(ctx context.Context, driverID string, request models.UpdateDriverPositionRequest) (models.Driver, error) {
	driverID = strings.TrimSpace(driverID)
	if driverID == "" {
		return models.Driver{}, ValidationError{Message: "Driver ID is required."}
	}

	location, ok := request.EffectiveLocation()
	if !ok || !isValidLocation(location) {
		return models.Driver{}, ValidationError{Message: "Position must include a valid latitude and longitude."}
	}

	return s.repo.UpdateDriverPosition(ctx, driverID, location)
}

func (s *DriverService) AssignDriver(ctx context.Context, request models.AssignDriverRequest) (models.AssignDriverResponse, error) {
	orderID := strings.TrimSpace(request.OrderID)
	if orderID == "" {
		return models.AssignDriverResponse{}, ValidationError{Message: "Order ID is required."}
	}

	assignment, driver, err := s.repo.AssignDriverToOrder(ctx, orderID, strings.TrimSpace(request.DriverID))
	if err != nil {
		return models.AssignDriverResponse{}, err
	}

	return models.AssignDriverResponse{
		Assignment: assignment,
		Driver:     driver,
	}, nil
}

func (s *DriverService) EstimateDelivery(ctx context.Context, request models.EstimateRequest) (models.EstimateResponse, error) {
	if request.CustomerLocation == nil || !isValidLocation(*request.CustomerLocation) {
		return models.EstimateResponse{}, ValidationError{Message: "Customer location must include a valid latitude and longitude."}
	}
	if request.PickupLocation != nil && !isValidLocation(*request.PickupLocation) {
		return models.EstimateResponse{}, ValidationError{Message: "Pickup location must include a valid latitude and longitude."}
	}

	drivers, err := s.repo.ListAvailableDrivers(ctx)
	if err != nil {
		return models.EstimateResponse{}, err
	}
	if len(drivers) == 0 {
		return models.EstimateResponse{}, repository.ErrNoAvailableDriver
	}

	driver := drivers[0]
	origin := driver.CurrentLocation
	if request.PickupLocation != nil {
		origin = *request.PickupLocation
	}

	routeResult, err := s.estimator.Estimate(ctx, RouteEstimateRequest{
		Origin:      origin,
		Destination: *request.CustomerLocation,
	})
	if err != nil {
		return models.EstimateResponse{}, fmt.Errorf("estimate route: %w", err)
	}

	estimate, err := s.repo.SaveRouteEstimate(ctx, models.RouteEstimate{
		OrderID:             strings.TrimSpace(request.OrderID),
		DriverID:            driver.DriverID,
		OriginLocation:      origin,
		DestinationLocation: *request.CustomerLocation,
		DistanceMeters:      routeResult.DistanceMeters,
		DurationSeconds:     routeResult.DurationSeconds,
		Provider:            routeResult.Provider,
	})
	if err != nil {
		return models.EstimateResponse{}, err
	}

	minutes := int(math.Ceil(float64(estimate.DurationSeconds) / 60))
	return models.EstimateResponse{
		Estimate:                     estimate,
		Driver:                       driver,
		EstimatedDeliveryTimeMinutes: minutes,
		EtaLabel:                     fmt.Sprintf("approx. %d min", minutes),
	}, nil
}

func (s *DriverService) GetTrackingByOrderID(ctx context.Context, orderID string) (models.TrackingResponse, error) {
	orderID = strings.TrimSpace(orderID)
	if orderID == "" {
		return models.TrackingResponse{}, ValidationError{Message: "Order ID is required."}
	}

	return s.repo.GetTrackingByOrderID(ctx, orderID)
}

func IsValidationError(err error) bool {
	var validationError ValidationError
	return errors.As(err, &validationError)
}

func ValidationMessage(err error) string {
	var validationError ValidationError
	if errors.As(err, &validationError) {
		return validationError.Message
	}

	return "Invalid input."
}

func isValidDriverStatus(status models.DriverStatus) bool {
	return status == models.DriverStatusAvailable ||
		status == models.DriverStatusOnDelivery ||
		status == models.DriverStatusOffline
}

func isValidLocation(location models.Location) bool {
	return !math.IsNaN(location.Lat) &&
		!math.IsNaN(location.Lng) &&
		location.Lat >= -90 &&
		location.Lat <= 90 &&
		location.Lng >= -180 &&
		location.Lng <= 180
}
