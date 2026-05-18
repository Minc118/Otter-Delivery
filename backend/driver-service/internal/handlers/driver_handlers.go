package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"otter-delivery/driver-service/internal/models"
	"otter-delivery/driver-service/internal/repository"
	driversvc "otter-delivery/driver-service/internal/services"
)

type DriverHandler struct {
	service *driversvc.DriverService
}

func NewDriverHandler(service *driversvc.DriverService) *DriverHandler {
	return &DriverHandler{service: service}
}

func (h *DriverHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /drivers/available", h.availableDrivers)
	mux.HandleFunc("GET /drivers/{driverId}", h.getDriver)
	mux.HandleFunc("GET /drivers/{driverId}/location", h.driverLocation)
	mux.HandleFunc("PATCH /drivers/{driverId}/position", h.updateDriverPosition)
	mux.HandleFunc("POST /drivers/assign", h.assignDriver)
	mux.HandleFunc("POST /drivers/estimate", h.estimate)
	mux.HandleFunc("GET /orders/{orderId}/tracking", h.orderTracking)
}

func (h *DriverHandler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, models.HealthResponse{
		Status:  "ok",
		Service: "driver-service",
	})
}

func (h *DriverHandler) availableDrivers(w http.ResponseWriter, r *http.Request) {
	drivers, err := h.service.AvailableDrivers(r.Context())
	if err != nil {
		writeDatabaseError(w, "Could not list available drivers.", err)
		return
	}

	writeJSON(w, http.StatusOK, models.AvailableDriversResponse{
		Drivers: drivers,
	})
}

func (h *DriverHandler) getDriver(w http.ResponseWriter, r *http.Request) {
	driver, err := h.service.GetDriverByID(r.Context(), r.PathValue("driverId"))
	if err != nil {
		handleError(w, err, "DRIVER_NOT_FOUND", "Driver could not be found.")
		return
	}

	writeJSON(w, http.StatusOK, driver)
}

func (h *DriverHandler) estimate(w http.ResponseWriter, r *http.Request) {
	var request models.EstimateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be valid JSON.")
		return
	}

	response, err := h.service.EstimateDelivery(r.Context(), request)
	if err != nil {
		handleError(w, err, "NO_AVAILABLE_DRIVER", "No available driver could be found.")
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *DriverHandler) driverLocation(w http.ResponseWriter, r *http.Request) {
	driver, err := h.service.GetDriverByID(r.Context(), r.PathValue("driverId"))
	if err != nil {
		handleError(w, err, "DRIVER_NOT_FOUND", "Driver could not be found.")
		return
	}

	writeJSON(w, http.StatusOK, models.DriverLocationResponse{
		DriverID:  driver.DriverID,
		Status:    driver.Status,
		Location:  driver.CurrentLocation,
		UpdatedAt: driver.LastPositionAt,
	})
}

func (h *DriverHandler) updateDriverPosition(w http.ResponseWriter, r *http.Request) {
	var request models.UpdateDriverPositionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be valid JSON.")
		return
	}

	driver, err := h.service.UpdateDriverPosition(r.Context(), r.PathValue("driverId"), request)
	if err != nil {
		handleError(w, err, "DRIVER_NOT_FOUND", "Driver could not be found.")
		return
	}

	writeJSON(w, http.StatusOK, driver)
}

func (h *DriverHandler) assignDriver(w http.ResponseWriter, r *http.Request) {
	var request models.AssignDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be valid JSON.")
		return
	}

	response, err := h.service.AssignDriver(r.Context(), request)
	if err != nil {
		handleError(w, err, "DRIVER_NOT_FOUND", "Driver could not be found or no available driver exists.")
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (h *DriverHandler) orderTracking(w http.ResponseWriter, r *http.Request) {
	response, err := h.service.GetTrackingByOrderID(r.Context(), r.PathValue("orderId"))
	if err != nil {
		handleError(w, err, "TRACKING_NOT_FOUND", "Order tracking data could not be found.")
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code string, message string) {
	writeJSON(w, status, models.ErrorResponse{
		Error: models.ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}

func handleError(w http.ResponseWriter, err error, notFoundCode string, notFoundMessage string) {
	if driversvc.IsValidationError(err) {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", driversvc.ValidationMessage(err))
		return
	}

	if errors.Is(err, repository.ErrNotFound) || errors.Is(err, repository.ErrNoAvailableDriver) {
		writeError(w, http.StatusNotFound, notFoundCode, notFoundMessage)
		return
	}

	if errors.Is(err, repository.ErrDriverUnavailable) {
		writeError(w, http.StatusBadRequest, "DRIVER_UNAVAILABLE", "Driver is not available for assignment.")
		return
	}

	if errors.Is(err, repository.ErrAlreadyAssigned) {
		writeError(w, http.StatusBadRequest, "ORDER_ALREADY_ASSIGNED", "Order already has a driver assignment.")
		return
	}

	writeDatabaseError(w, "Database operation failed.", err)
}

func writeDatabaseError(w http.ResponseWriter, message string, err error) {
	log.Printf("%s: %v", message, err)
	writeError(w, http.StatusInternalServerError, "DATABASE_ERROR", message)
}
