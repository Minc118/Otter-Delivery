package services

import (
	"errors"
	"os"
	"strconv"
	"sync"
	"time"

	"otter-delivery/driver-service/internal/models"
)

const (
	StatusAvailable  = "AVAILABLE"
	StatusOnDelivery = "ON_DELIVERY"
	StatusOffline    = "OFFLINE"
)

type DriverService struct {
	drivers map[string]models.Driver
	mu      sync.RWMutex
}

func NewDriverService() *DriverService {
	return &DriverService{
		drivers: map[string]models.Driver{
			"drv_001": {
				DriverID: "drv_001",
				Name:     "Alex M.",
				Status:   StatusAvailable,
				CurrentLocation: models.Location{
					Lat: 52.5200,
					Lng: 13.4050,
				},
			},
			"drv_002": {
				DriverID: "drv_002",
				Name:     "Sam K.",
				Status:   StatusAvailable,
				CurrentLocation: models.Location{
					Lat: 52.5180,
					Lng: 13.4090,
				},
			},
		},
	}
}

func (s *DriverService) AvailableDrivers() []models.Driver {
	s.mu.RLock()
	defer s.mu.RUnlock()

	drivers := make([]models.Driver, 0)
	for _, driver := range s.drivers {
		if driver.Status == StatusAvailable {
			drivers = append(drivers, driver)
		}
	}

	return drivers
}

func (s *DriverService) EstimateDelivery(_ models.EstimateRequest) (models.EstimateResponse, error) {
	drivers := s.AvailableDrivers()
	if len(drivers) == 0 {
		return models.EstimateResponse{}, errors.New("no available drivers")
	}

	// TODO: Replace the fixed ETA with Google Maps route estimation later.
	driver := drivers[0]
	minutes := fixedETAMinutes()

	return models.EstimateResponse{
		EstimatedDeliveryTimeMinutes: minutes,
		EtaLabel:                     "approx. 40 min",
		DriverID:                     driver.DriverID,
		Status:                       driver.Status,
	}, nil
}

func (s *DriverService) DriverLocation(driverID string) (models.DriverLocationResponse, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	driver, ok := s.drivers[driverID]
	if !ok {
		return models.DriverLocationResponse{}, false
	}

	return models.DriverLocationResponse{
		DriverID:  driver.DriverID,
		Status:    driver.Status,
		Location:  driver.CurrentLocation,
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}, true
}

func (s *DriverService) UpdateStatus(driverID string, status string) (models.StatusUpdateResponse, error) {
	if !isValidStatus(status) {
		return models.StatusUpdateResponse{}, errors.New("invalid driver status")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	driver, ok := s.drivers[driverID]
	if !ok {
		return models.StatusUpdateResponse{}, errors.New("driver not found")
	}

	driver.Status = status
	s.drivers[driverID] = driver

	return models.StatusUpdateResponse{
		DriverID: driver.DriverID,
		Status:   driver.Status,
	}, nil
}

func fixedETAMinutes() int {
	value := os.Getenv("ETA_MINUTES")
	if value == "" {
		return 40
	}

	minutes, err := strconv.Atoi(value)
	if err != nil || minutes <= 0 {
		return 40
	}

	return minutes
}

func isValidStatus(status string) bool {
	return status == StatusAvailable || status == StatusOnDelivery || status == StatusOffline
}
