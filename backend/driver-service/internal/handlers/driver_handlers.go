package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"otter-delivery/driver-service/internal/models"
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
	mux.HandleFunc("POST /drivers/estimate", h.estimate)
	mux.HandleFunc("GET /drivers/{driverId}/location", h.driverLocation)
	mux.HandleFunc("PATCH /drivers/{driverId}/status", h.updateStatus)
}

func (h *DriverHandler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, models.HealthResponse{
		Status:  "ok",
		Service: "driver-service",
	})
}

func (h *DriverHandler) availableDrivers(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, models.AvailableDriversResponse{
		Drivers: h.service.AvailableDrivers(),
	})
}

func (h *DriverHandler) estimate(w http.ResponseWriter, r *http.Request) {
	var request models.EstimateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be valid JSON.")
		return
	}

	response, err := h.service.EstimateDelivery(request)
	if err != nil {
		writeError(w, http.StatusNotFound, "NO_AVAILABLE_DRIVER", "No available driver could be found.")
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *DriverHandler) driverLocation(w http.ResponseWriter, r *http.Request) {
	driverID := r.PathValue("driverId")
	response, ok := h.service.DriverLocation(driverID)
	if !ok {
		writeError(w, http.StatusNotFound, "DRIVER_NOT_FOUND", "Driver could not be found.")
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *DriverHandler) updateStatus(w http.ResponseWriter, r *http.Request) {
	driverID := r.PathValue("driverId")

	var request models.StatusUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be valid JSON.")
		return
	}

	response, err := h.service.UpdateStatus(driverID, strings.ToUpper(request.Status))
	if err != nil {
		if err.Error() == "driver not found" {
			writeError(w, http.StatusNotFound, "DRIVER_NOT_FOUND", "Driver could not be found.")
			return
		}

		writeError(w, http.StatusBadRequest, "INVALID_DRIVER_STATUS", "Driver status must be AVAILABLE, ON_DELIVERY, or OFFLINE.")
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
