package com.otterdelivery.translationservice.client;

import com.otterdelivery.translationservice.model.AddressDTO;
import com.otterdelivery.translationservice.model.CategoryDTO;
import com.otterdelivery.translationservice.model.FoodItemResponseDTO;
import com.otterdelivery.translationservice.model.RestaurantResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;



@Component
@Slf4j
public class RestaurantClient {

    private final WebClient webClient;

    public RestaurantClient(
            @Qualifier("restaurantWebClient")
            WebClient webClient) {
        this.webClient = webClient;
    }

    @Value("${restaurant-service.base-url}")
    private String baseUrl;


    public Mono<RestaurantResponseDTO> getRestaurantById(Long id) {
        return webClient.get()
                .uri(baseUrl + "/restaurants/{id}", id)
                .retrieve()
                .bodyToMono(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch restaurant with id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Flux<RestaurantResponseDTO> getAllRestaurants() {
        return webClient.get()
                .uri(baseUrl + "/restaurants")
                .retrieve()
                .bodyToFlux(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch restaurants: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<RestaurantResponseDTO> searchRestaurantsByName(String name) {
        return webClient.get()
                .uri(baseUrl + "/restaurants/search?name={name}", name)
                .retrieve()
                .bodyToFlux(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to search restaurants by name {}: {}", name, e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<RestaurantResponseDTO> getOpenRestaurants() {
        return webClient.get()
                .uri(baseUrl + "/restaurants/open")
                .retrieve()
                .bodyToFlux(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch open restaurants: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<CategoryDTO> getCategoriesByRestaurantId(Long restaurantId) {
        return webClient.get()
                .uri(baseUrl + "/categories/restaurants/{restaurantId}", restaurantId)
                .retrieve()
                .bodyToFlux(CategoryDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch categories for restaurant id {}: {}", restaurantId, e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<FoodItemResponseDTO> getFoodItemsByCategoryId(Long categoryId) {
        return webClient.get()
                .uri(baseUrl + "/food-items/categories/{categoryId}", categoryId)
                .retrieve()
                .bodyToFlux(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch food items for category id {}: {}", categoryId, e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<FoodItemResponseDTO> getFoodItemsByRestaurantId(Long restaurantId) {
        return webClient.get()
                .uri(baseUrl + "/food-items/restaurants/{restaurantId}", restaurantId)
                .retrieve()
                .bodyToFlux(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch food items for restaurant id {}: {}", restaurantId, e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<FoodItemResponseDTO> searchFoodItemsByName(String name) {
        return webClient.get()
                .uri(baseUrl + "/food-items/search?name={name}", name)
                .retrieve()
                .bodyToFlux(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to search food items by name {}: {}", name, e.getMessage());
                    return Flux.empty();
                });
    }

    public Flux<FoodItemResponseDTO> getAvailableFoodItems() {
        return webClient.get()
                .uri(baseUrl + "/food-items/available")
                .retrieve()
                .bodyToFlux(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to fetch available food items: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    public Mono<RestaurantResponseDTO> createRestaurant(RestaurantResponseDTO restaurant) {
        return webClient.post()
                .uri(baseUrl + "/restaurants")
                .bodyValue(restaurant)
                .retrieve()
                .bodyToMono(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to create restaurant: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<RestaurantResponseDTO> updateRestaurant(Long id, RestaurantResponseDTO restaurant) {
        return webClient.put()
                .uri(baseUrl + "/restaurants/{id}", id)
                .bodyValue(restaurant)
                .retrieve()
                .bodyToMono(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to update restaurant with id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<Void> deleteRestaurant(Long id) {
        return webClient.delete()
                .uri(baseUrl + "/restaurants/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    log.warn("Failed to delete restaurant with id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<RestaurantResponseDTO> patchRestaurantStatus(Long id, boolean open) {
        return webClient.patch()
                .uri(baseUrl + "/restaurants/{id}/status?open={open}", id, open)
                .retrieve()
                .bodyToMono(RestaurantResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to patch restaurant status for id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<FoodItemResponseDTO> createFoodItem(Long categoryId, FoodItemResponseDTO foodItem) {
        return webClient.post()
                .uri(baseUrl + "/food-items/categories/{categoryId}", categoryId)
                .bodyValue(foodItem)
                .retrieve()
                .bodyToMono(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to create food item for category id {}: {}", categoryId, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<FoodItemResponseDTO> updateFoodItem(Long id, FoodItemResponseDTO foodItem) {
        return webClient.put()
                .uri(baseUrl + "/food-items/{id}", id)
                .bodyValue(foodItem)
                .retrieve()
                .bodyToMono(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to update food item with id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<Void> deleteFoodItem(Long id) {
        return webClient.delete()
                .uri(baseUrl + "/food-items/{id}", id)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    log.warn("Failed to delete food item with id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<FoodItemResponseDTO> patchFoodItemAvailability(Long id, boolean available) {
        return webClient.patch()
                .uri(baseUrl + "/food-items/{id}/availability?available={available}", id, available)
                .retrieve()
                .bodyToMono(FoodItemResponseDTO.class)
                .onErrorResume(e -> {
                    log.warn("Failed to patch food item availability for id {}: {}", id, e.getMessage());
                    return Mono.empty();
                });
    }
}