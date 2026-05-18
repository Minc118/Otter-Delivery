package services

import (
	"context"
	"math"

	"otter-delivery/driver-service/internal/models"
)

type RouteEstimateRequest struct {
	Origin      models.Location
	Destination models.Location
}

type RouteEstimateResult struct {
	DistanceMeters  int
	DurationSeconds int
	Provider        string
}

type RouteEstimator interface {
	Estimate(ctx context.Context, request RouteEstimateRequest) (RouteEstimateResult, error)
}

type MockRouteEstimator struct {
	etaMinutes int
}

func NewMockRouteEstimator(etaMinutes int) *MockRouteEstimator {
	return &MockRouteEstimator{etaMinutes: etaMinutes}
}

func (e *MockRouteEstimator) Estimate(_ context.Context, request RouteEstimateRequest) (RouteEstimateResult, error) {
	return RouteEstimateResult{
		DistanceMeters:  haversineDistanceMeters(request.Origin, request.Destination),
		DurationSeconds: e.etaMinutes * 60,
		Provider:        "mock",
	}, nil
}

func haversineDistanceMeters(origin models.Location, destination models.Location) int {
	const earthRadiusMeters = 6371000

	lat1 := degreesToRadians(origin.Lat)
	lat2 := degreesToRadians(destination.Lat)
	deltaLat := degreesToRadians(destination.Lat - origin.Lat)
	deltaLng := degreesToRadians(destination.Lng - origin.Lng)

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return int(math.Round(earthRadiusMeters * c))
}

func degreesToRadians(degrees float64) float64 {
	return degrees * math.Pi / 180
}
