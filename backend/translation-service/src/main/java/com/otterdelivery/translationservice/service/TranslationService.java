package com.otterdelivery.translationservice.service;

import com.otterdelivery.translationservice.client.RestaurantClient;
import com.otterdelivery.translationservice.client.TranslationClient;
import com.otterdelivery.translationservice.dtos.TranslatedCategoryDTO;
import com.otterdelivery.translationservice.dtos.TranslatedFoodItemResponseDTO;
import com.otterdelivery.translationservice.dtos.TranslatedRestaurantResponseDTO;
import com.otterdelivery.translationservice.model.AddressDTO;
import com.otterdelivery.translationservice.model.CategoryDTO;
import com.otterdelivery.translationservice.model.FoodItemResponseDTO;
import com.otterdelivery.translationservice.model.RestaurantResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for translating restaurant data.
 * Orchestrates fetching from restaurant-service and translating text fields.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationService {

    private final RestaurantClient restaurantClient;
    private final TranslationClient translationClient;

    /**
     * Get a restaurant by ID with translated name and description.
     *
     * @param id the restaurant ID
     * @param targetLang the target language code
     * @return Mono containing the translated restaurant DTO
     */
    public Mono<TranslatedRestaurantResponseDTO> getTranslatedRestaurantById(Long id, String targetLang) {
        return restaurantClient.getRestaurantById(id)
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang))
                .switchIfEmpty(Mono.error(() -> new RuntimeException("Restaurant not found with id: " + id)));
    }

    /**
     * Get all restaurants with translated name and description.
     *
     * @param targetLang the target language code
     * @return Flux containing translated restaurant DTOs
     */
    public Flux<TranslatedRestaurantResponseDTO> getAllTranslatedRestaurants(String targetLang) {
        return restaurantClient.getAllRestaurants()
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }

    /**
     * Search restaurants by name with translated results.
     *
     * @param name the restaurant name to search for
     * @param targetLang the target language code
     * @return Flux containing translated restaurant DTOs
     */
    public Flux<TranslatedRestaurantResponseDTO> searchTranslatedRestaurantsByName(String name, String targetLang) {
        return restaurantClient.searchRestaurantsByName(name)
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }

    /**
     * Get open restaurants with translated name and description.
     *
     * @param targetLang the target language code
     * @return Flux containing translated restaurant DTOs
     */
    public Flux<TranslatedRestaurantResponseDTO> getOpenTranslatedRestaurants(String targetLang) {
        return restaurantClient.getOpenRestaurants()
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }

    /**
     * Get categories for a restaurant with translated name and description.
     *
     * @param restaurantId the restaurant ID
     * @param targetLang the target language code
     * @return Flux containing translated category DTOs
     */
    public Flux<TranslatedCategoryDTO> getTranslatedCategoriesByRestaurantId(Long restaurantId, String targetLang) {
        return restaurantClient.getCategoriesByRestaurantId(restaurantId)
                .flatMap(category -> translateCategory(category, targetLang));
    }

    /**
     * Get food items for a category with translated name and description.
     *
     * @param categoryId the category ID
     * @param targetLang the target language code
     * @return Flux containing translated food item DTOs
     */
    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByCategoryId(Long categoryId, String targetLang) {
        return restaurantClient.getFoodItemsByCategoryId(categoryId)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }

    /**
     * Get food items for a restaurant with translated name and description.
     *
     * @param restaurantId the restaurant ID
     * @param targetLang the target language code
     * @return Flux containing translated food item DTOs
     */
    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByRestaurantId(Long restaurantId, String targetLang) {
        return restaurantClient.getFoodItemsByRestaurantId(restaurantId)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }

    /**
     * Search food items by name with translated results.
     *
     * @param name the food item name to search for
     * @param targetLang the target language code
     * @return Flux containing translated food item DTOs
     */
    public Flux<TranslatedFoodItemResponseDTO> searchTranslatedFoodItemsByName(String name, String targetLang) {
        return restaurantClient.searchFoodItemsByName(name)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }

    /**
     * Get available food items with translated name and description.
     *
     * @param targetLang the target language code
     * @return Flux containing translated food item DTOs
     */
    public Flux<TranslatedFoodItemResponseDTO> getAvailableTranslatedFoodItems(String targetLang) {
        return restaurantClient.getAvailableFoodItems()
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }

    /**
     * Translate a restaurant's name and description.
     *
     * @param restaurant the restaurant to translate
     * @param targetLang the target language code
     * @return Mono containing the translated restaurant DTO
     */
    private Mono<TranslatedRestaurantResponseDTO> translateRestaurant(RestaurantResponseDTO restaurant, String targetLang) {
        Mono<String> translatedName = translationClient.translate(restaurant.getName(), targetLang);
        Mono<String> translatedDescription = translationClient.translate(restaurant.getDescription(), targetLang);

        return Mono.zip(translatedName, translatedDescription)
                .map(tuple -> {
                    TranslatedRestaurantResponseDTO translated = new TranslatedRestaurantResponseDTO();
                    translated.setId(restaurant.getId());
                    translated.setName(tuple.getT1());
                    translated.setDescription(tuple.getT2());
                    translated.setPhoneNumber(restaurant.getPhoneNumber());
                    translated.setEmail(restaurant.getEmail());
                    translated.setOpen(restaurant.isOpen());
                    translated.setDeliveryRadiusKm(restaurant.getDeliveryRadiusKm());
                    translated.setOpeningTime(restaurant.getOpeningTime());
                    translated.setClosingTime(restaurant.getClosingTime());
                    translated.setAddress(restaurant.getAddress());

                    // Translate categories
                    if (restaurant.getCategories() != null) {
                        translated.setCategories(
                                restaurant.getCategories().stream()
                                        .map(category -> translateCategorySync(category, targetLang))
                                        .toList()
                        );
                    }

                    return translated;
                });
    }

    /**
     * Translate a category's name and description.
     *
     * @param category the category to translate
     * @param targetLang the target language code
     * @return Mono containing the translated category DTO
     */
    private Mono<TranslatedCategoryDTO> translateCategory(CategoryDTO category, String targetLang) {
        Mono<String> translatedName = translationClient.translate(category.getName(), targetLang);
        Mono<String> translatedDescription = translationClient.translate(category.getDescription(), targetLang);

        return Mono.zip(translatedName, translatedDescription)
                .map(tuple -> {
                    TranslatedCategoryDTO translated = new TranslatedCategoryDTO();
                    translated.setId(category.getId());
                    translated.setName(tuple.getT1());
                    translated.setDescription(tuple.getT2());
                    return translated;
                });
    }

    /**
     * Translate a food item's name and description.
     *
     * @param foodItem the food item to translate
     * @param targetLang the target language code
     * @return Mono containing the translated food item DTO
     */
    private Mono<TranslatedFoodItemResponseDTO> translateFoodItem(FoodItemResponseDTO foodItem, String targetLang) {
        Mono<String> translatedName = translationClient.translate(foodItem.getName(), targetLang);
        Mono<String> translatedDescription = translationClient.translate(foodItem.getDescription(), targetLang);

        return Mono.zip(translatedName, translatedDescription)
                .map(tuple -> {
                    TranslatedFoodItemResponseDTO translated = new TranslatedFoodItemResponseDTO();
                    translated.setId(foodItem.getId());
                    translated.setName(tuple.getT1());
                    translated.setDescription(tuple.getT2());
                    translated.setPrice(foodItem.getPrice());
                    translated.setAvailable(foodItem.isAvailable());
                    translated.setPreparationTimeMinutes(foodItem.getPreparationTimeMinutes());
                    translated.setImageUrl(foodItem.getImageUrl());
                    translated.setCategoryId(foodItem.getCategoryId());
                    return translated;
                });
    }

    /**
     * Synchronous version of category translation for use within zip operations.
     * Uses caching to avoid repeated translation calls.
     */
    @Cacheable(cacheNames = "translations", key = "#root.targetLang + '::' + #category.name + '::' + #category.description")
    private TranslatedCategoryDTO translateCategorySync(CategoryDTO category, String targetLang) {
        // This method is cached and will be called from within the zip operation
        // We need to handle the translation synchronously here
        try {
            String translatedName = translationClient.translate(category.getName(), targetLang).block();
            String translatedDescription = translationClient.translate(category.getDescription(), targetLang).block();

            TranslatedCategoryDTO translated = new TranslatedCategoryDTO();
            translated.setId(category.getId());
            translated.setName(translatedName != null ? translatedName : category.getName());
            translated.setDescription(translatedDescription != null ? translatedDescription : category.getDescription());
            return translated;
        } catch (Exception e) {
            log.warn("Failed to translate category synchronously: {}", e.getMessage());
            TranslatedCategoryDTO translated = new TranslatedCategoryDTO();
            translated.setId(category.getId());
            translated.setName(category.getName());
            translated.setDescription(category.getDescription());
            return translated;
        }
    }
}