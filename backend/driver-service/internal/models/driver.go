package models

import "time"

type DriverStatus string

const (
	DriverStatusAvailable  DriverStatus = "AVAILABLE"
	DriverStatusOnDelivery DriverStatus = "ON_DELIVERY"
	DriverStatusOffline    DriverStatus = "OFFLINE"
)

type DeliveryAssignmentStatus string

const (
	DeliveryAssignmentStatusAssigned  DeliveryAssignmentStatus = "ASSIGNED"
	DeliveryAssignmentStatusPickedUp  DeliveryAssignmentStatus = "PICKED_UP"
	DeliveryAssignmentStatusInTransit DeliveryAssignmentStatus = "IN_TRANSIT"
	DeliveryAssignmentStatusDelivered DeliveryAssignmentStatus = "DELIVERED"
	DeliveryAssignmentStatusCancelled DeliveryAssignmentStatus = "CANCELLED"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Driver struct {
	DriverID        string       `json:"driverId"`
	Name            string       `json:"name"`
	Status          DriverStatus `json:"status"`
	CurrentLocation Location     `json:"currentLocation"`
	LastPositionAt  time.Time    `json:"lastPositionAt"`
	CreatedAt       time.Time    `json:"createdAt"`
	UpdatedAt       time.Time    `json:"updatedAt"`
}

type DeliveryAssignment struct {
	AssignmentID string                   `json:"assignmentId"`
	OrderID      string                   `json:"orderId"`
	DriverID     string                   `json:"driverId"`
	Status       DeliveryAssignmentStatus `json:"status"`
	AssignedAt   time.Time                `json:"assignedAt"`
	PickedUpAt   *time.Time               `json:"pickedUpAt,omitempty"`
	DeliveredAt  *time.Time               `json:"deliveredAt,omitempty"`
	CreatedAt    time.Time                `json:"createdAt"`
	UpdatedAt    time.Time                `json:"updatedAt"`
}

type TrackingEvent struct {
	EventID      string    `json:"eventId"`
	OrderID      string    `json:"orderId"`
	AssignmentID *string   `json:"assignmentId,omitempty"`
	DriverID     *string   `json:"driverId,omitempty"`
	EventType    string    `json:"eventType"`
	Message      string    `json:"message,omitempty"`
	Location     *Location `json:"location,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

type RouteEstimate struct {
	EstimateID          string    `json:"estimateId"`
	OrderID             string    `json:"orderId,omitempty"`
	DriverID            string    `json:"driverId"`
	OriginLocation      Location  `json:"originLocation"`
	DestinationLocation Location  `json:"destinationLocation"`
	DistanceMeters      int       `json:"distanceMeters"`
	DurationSeconds     int       `json:"durationSeconds"`
	Provider            string    `json:"provider"`
	CreatedAt           time.Time `json:"createdAt"`
}

type CreateDriverRequest struct {
	Name            string       `json:"name"`
	Status          DriverStatus `json:"status,omitempty"`
	CurrentLocation *Location    `json:"currentLocation,omitempty"`
}

type UpdateDriverPositionRequest struct {
	Location *Location `json:"location,omitempty"`
	Lat      *float64  `json:"lat,omitempty"`
	Lng      *float64  `json:"lng,omitempty"`
}

func (r UpdateDriverPositionRequest) EffectiveLocation() (Location, bool) {
	if r.Location != nil {
		return *r.Location, true
	}

	if r.Lat != nil && r.Lng != nil {
		return Location{Lat: *r.Lat, Lng: *r.Lng}, true
	}

	return Location{}, false
}

type AssignDriverRequest struct {
	OrderID  string `json:"orderId"`
	DriverID string `json:"driverId,omitempty"`
}

type AvailableDriversResponse struct {
	Drivers []Driver `json:"drivers"`
}

type EstimateRequest struct {
	OrderID          string    `json:"orderId,omitempty"`
	RestaurantID     string    `json:"restaurantId,omitempty"`
	PickupLocation   *Location `json:"pickupLocation,omitempty"`
	CustomerLocation *Location `json:"customerLocation"`
}

type EstimateResponse struct {
	Estimate                     RouteEstimate `json:"estimate"`
	Driver                       Driver        `json:"driver"`
	EstimatedDeliveryTimeMinutes int           `json:"estimatedDeliveryTimeMinutes"`
	EtaLabel                     string        `json:"etaLabel"`
}

type DriverLocationResponse struct {
	DriverID  string       `json:"driverId"`
	Status    DriverStatus `json:"status"`
	Location  Location     `json:"location"`
	UpdatedAt time.Time    `json:"updatedAt"`
}

type AssignDriverResponse struct {
	Assignment DeliveryAssignment `json:"assignment"`
	Driver     Driver             `json:"driver"`
}

type TrackingResponse struct {
	OrderID    string              `json:"orderId"`
	Assignment *DeliveryAssignment `json:"assignment,omitempty"`
	Events     []TrackingEvent     `json:"events"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}
