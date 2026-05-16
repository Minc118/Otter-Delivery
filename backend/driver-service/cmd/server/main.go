package main

import (
	"log"
	"net/http"
	"os"

	"otter-delivery/driver-service/internal/handlers"
	driversvc "otter-delivery/driver-service/internal/services"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	driverService := driversvc.NewDriverService()
	handler := handlers.NewDriverHandler(driverService)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":" + port
	log.Printf("driver-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
