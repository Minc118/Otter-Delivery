package config

import (
	"bufio"
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port             string
	DatabaseURL      string
	GoogleMapsAPIKey string
	GoogleRoutesKey  string
	ETAMinutes       int
}

func Load() (Config, error) {
	loadDotEnvFiles(".env", "../.env", "../../.env")

	cfg := Config{
		Port:             getEnv("PORT", "8003"),
		DatabaseURL:      firstNonEmpty("DRIVER_DATABASE_URL", "DATABASE_URL"),
		GoogleMapsAPIKey: os.Getenv("GOOGLE_MAPS_API_KEY"),
		GoogleRoutesKey:  os.Getenv("GOOGLE_ROUTES_API_KEY"),
		ETAMinutes:       getPositiveInt("ETA_MINUTES", 40),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DRIVER_DATABASE_URL or DATABASE_URL is required")
	}

	return cfg, nil
}

func loadDotEnvFiles(paths ...string) {
	for _, path := range paths {
		_ = loadDotEnvFile(path)
	}
}

func loadDotEnvFile(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		if key == "" || os.Getenv(key) != "" {
			continue
		}

		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)
		_ = os.Setenv(key, value)
	}

	return scanner.Err()
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func firstNonEmpty(keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(os.Getenv(key))
		if value != "" {
			return value
		}
	}

	return ""
}

func getPositiveInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	number, err := strconv.Atoi(value)
	if err != nil || number <= 0 {
		return fallback
	}

	return number
}
