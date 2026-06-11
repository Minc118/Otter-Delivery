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

import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationService {

    private final RestaurantClient restaurantClient;
    private final TranslationClient translationClient;

    public Mono<TranslatedRestaurantResponseDTO> getTranslatedRestaurantById(Long id, String targetLang) {
        return restaurantClient.getRestaurantById(id)
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang))
                .switchIfEmpty(Mono.error(() -> new RuntimeException("Restaurant not found with id: " + id)));
    }

    public Flux<TranslatedRestaurantResponseDTO> getAllTranslatedRestaurants(String targetLang) {
        return restaurantClient.getAllRestaurants()
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }


    public Flux<TranslatedRestaurantResponseDTO> searchTranslatedRestaurantsByName(String name, String targetLang) {
        return restaurantClient.searchRestaurantsByName(name)
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }


    public Flux<TranslatedRestaurantResponseDTO> getOpenTranslatedRestaurants(String targetLang) {
        return restaurantClient.getOpenRestaurants()
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }

    public Flux<TranslatedCategoryDTO> getTranslatedCategoriesByRestaurantId(Long restaurantId, String targetLang) {
        return restaurantClient.getCategoriesByRestaurantId(restaurantId)
                .flatMap(category -> translateCategory(category, targetLang));
    }


    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByCategoryId(Long categoryId, String targetLang) {
        return restaurantClient.getFoodItemsByCategoryId(categoryId)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }


    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByRestaurantId(Long restaurantId, String targetLang) {
        return restaurantClient.getFoodItemsByRestaurantId(restaurantId)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }


    public Flux<TranslatedFoodItemResponseDTO> searchTranslatedFoodItemsByName(String name, String targetLang) {
        return restaurantClient.searchFoodItemsByName(name)
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }


    public Flux<TranslatedFoodItemResponseDTO> getAvailableTranslatedFoodItems(String targetLang) {
        return restaurantClient.getAvailableFoodItems()
                .flatMap(foodItem -> translateFoodItem(foodItem, targetLang));
    }


    private Mono<TranslatedRestaurantResponseDTO> translateRestaurant(RestaurantResponseDTO restaurant, String targetLang) {
        Mono<String> translatedName = translationClient.translate(restaurant.getName(), targetLang);
        Mono<String> translatedDescription = translationClient.translate(restaurant.getDescription(), targetLang);

//        return Mono.zip(translatedName, translatedDescription)
//                .map(tuple -> {
//                    TranslatedRestaurantResponseDTO translated = new TranslatedRestaurantResponseDTO();
//                    translated.setId(restaurant.getId());
//                    translated.setName(tuple.getT1());
//                    translated.setDescription(tuple.getT2());
//                    translated.setPhoneNumber(restaurant.getPhoneNumber());
//                    translated.setEmail(restaurant.getEmail());
//                    translated.setOpen(restaurant.isOpen());
//                    translated.setDeliveryRadiusKm(restaurant.getDeliveryRadiusKm());
//                    translated.setOpeningTime(restaurant.getOpeningTime());
//                    translated.setClosingTime(restaurant.getClosingTime());
//                    translated.setAddress(restaurant.getAddress());
//
//
//                    if (restaurant.getCategories() != null) {
//                        translated.setCategories(
//                                restaurant.getCategories().stream()
//                                        .map(category -> translateCategorySync(category, targetLang))
//                                        .toList()
//                        );
//                    }
//
//                    return translated;
//                });
        return Mono.zip(translatedName, translatedDescription)
                .flatMap(tuple ->
                        Flux.fromIterable(restaurant.getCategories() == null
                                        ? List.of()
                                        : restaurant.getCategories())
                                .flatMap(category -> translateCategory(category, targetLang))
                                .collectList()
                                .map(translatedCategories -> {
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
                                    translated.setCategories(translatedCategories);
                                    return translated;
                                })
                );
    }


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


}