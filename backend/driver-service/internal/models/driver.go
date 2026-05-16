package models

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Driver struct {
	DriverID        string   `json:"driverId"`
	Name            string   `json:"name"`
	Status          string   `json:"status"`
	CurrentLocation Location `json:"currentLocation"`
}

type AvailableDriversResponse struct {
	Drivers []Driver `json:"drivers"`
}

type EstimateRequest struct {
	RestaurantID     string   `json:"restaurantId"`
	CustomerLocation Location `json:"customerLocation"`
}

type EstimateResponse struct {
	EstimatedDeliveryTimeMinutes int    `json:"estimatedDeliveryTimeMinutes"`
	EtaLabel                     string `json:"etaLabel"`
	DriverID                     string `json:"driverId"`
	Status                       string `json:"status"`
}

type DriverLocationResponse struct {
	DriverID  string   `json:"driverId"`
	Status    string   `json:"status"`
	Location  Location `json:"location"`
	UpdatedAt string   `json:"updatedAt"`
}

type StatusUpdateRequest struct {
	Status string `json:"status"`
}

type StatusUpdateResponse struct {
	DriverID string `json:"driverId"`
	Status   string `json:"status"`
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
