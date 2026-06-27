# Translation Service

This service acts as a middleware translation layer between the frontend and restaurant-service in the Otter Delivery system.

## Overview

The translation-service fetches data from restaurant-service, translates specific text fields using the DeepL API, and returns translated DTOs to the frontend.

## Features

- Translates restaurant names and descriptions
- Translates category names and descriptions  
- Translates food item names and descriptions
- Uses WebClient for non-blocking HTTP calls
- Implements caching with Spring Cache + Caffeine to avoid duplicate translations
- Resilient error handling with fallbacks to original text
- Supports multiple target languages via language parameter

## Architecture

```
Frontend → translation-service → restaurant-service → database
```

## Technology Stack

- Java 17
- Spring Boot 3.x
- Spring WebFlux (WebClient)
- Spring Cache abstraction
- Caffeine (in-memory cache)
- Lombok
- Validation

## API Endpoints

All endpoints require a `lang` parameter specifying the target language (e.g., `de`, `fr`, `es`).

### Restaurant Endpoints
- `GET /api/translations/restaurants/{id}` - Get translated restaurant by ID
- `GET /api/translations/restaurants` - Get all translated restaurants
- `GET /api/translations/restaurants/search?name={name}` - Search translated restaurants by name
- `GET /api/translations/restaurants/open` - Get translated open restaurants

### Category Endpoints
- `GET /api/translations/restaurants/{restaurantId}/categories` - Get translated categories for a restaurant

### Food Item Endpoints
- `GET /api/translations/categories/{categoryId}/food-items` - Get translated food items for a category
- `GET /api/translations/restaurants/{restaurantId}/food-items` - Get translated food items for a restaurant
- `GET /api/translations/food-items/search?name={name}` - Search translated food items by name
- `GET /api/translations/food-items/available` - Get translated available food items

### Health Endpoint
- `GET /api/translations/health` - Health check

## Configuration

Configure the following in `application.yml` or via environment variables:

```yaml
server:
  port: 8005

restaurant-service:
  base-url: http://localhost:8080/api

deepl:
  api-key: ${DEEPL_API_KEY}  # Set via environment variable
  base-url: https://api-free.deepl.com/v2/translate

cache:
  caffeine:
    spec: maximumSize=500,expireAfterAccess=10m
```

## Translation Rules

Only the following fields are translated:
- Restaurant: name, description
- Category: name, description  
- FoodItem: name, description

All other fields (IDs, prices, booleans, etc.) remain unchanged.

## Caching

Translation results are cached using the cache key format: `original_text + target_language`
Cache applies to all translatable text fields to prevent redundant API calls.

## Error Handling

- If restaurant-service is unavailable: returns cached data if available, otherwise empty responses
- If DeepL API fails: returns original (non-translated) text, service continues operating
- All failures are logged but don't cause service crashes

## Running the Service

```bash
# Build
mvn clean package

# Run
java -jar target/translation-service-0.0.1-SNAPSHOT.jar

# Set DeepL API key as environment variable
export DEEPL_API_KEY=your_deepl_api_key_here
```

## Docker

A Dockerfile can be added for containerization:
```dockerfile
FROM eclipse-temurin:17-jdk
VOLUME /tmp
ADD target/translation-service-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

Build and run:
```bash
docker build -t translation-service .
docker run -p 8005:8005 -e DEEPL_API_KEY=your_key translation-service
```