package main

import (
	"context"
	"log"
	"net/http"

	"otter-delivery/driver-service/internal/config"
	database "otter-delivery/driver-service/internal/db"
	"otter-delivery/driver-service/internal/handlers"
	"otter-delivery/driver-service/internal/repository"
	driversvc "otter-delivery/driver-service/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pool.Close()

	driverRepository := repository.NewPostgresDriverRepository(pool)
	routeEstimator := driversvc.NewMockRouteEstimator(cfg.ETAMinutes)
	driverService := driversvc.NewDriverService(driverRepository, routeEstimator)
	handler := handlers.NewDriverHandler(driverService)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":" + cfg.Port
	log.Printf("driver-service listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
