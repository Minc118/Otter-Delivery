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

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationService {

    private final RestaurantClient restaurantClient;
    private final TranslationClient translationClient;

    private record RestaurantTranslationInput(
            RestaurantResponseDTO restaurant,
            int nameIndex,
            int descriptionIndex
    ) {
    }


    public Mono<TranslatedRestaurantResponseDTO> getTranslatedRestaurantById(Long id, String targetLang) {
        return restaurantClient.getRestaurantById(id)
                .switchIfEmpty(Mono.error(
                        new RuntimeException("Restaurant not found with id: " + id)
                ))
                .flatMap(restaurant -> {

                    List<String> texts = new java.util.ArrayList<>();

                    texts.add(restaurant.getName());
                    texts.add(restaurant.getDescription());


                    return translationClient.translateBatch(texts, targetLang)
                            .map(translatedTexts -> {

                                int i = 0;

                                TranslatedRestaurantResponseDTO dto = new TranslatedRestaurantResponseDTO();

                                dto.setId(restaurant.getId());
                                dto.setName(translatedTexts.get(i++));
                                dto.setDescription(translatedTexts.get(i++));
                                dto.setPhoneNumber(restaurant.getPhoneNumber());
                                dto.setEmail(restaurant.getEmail());
                                dto.setOpen(restaurant.isOpen());
                                dto.setDeliveryRadiusKm(restaurant.getDeliveryRadiusKm());
                                dto.setOpeningTime(restaurant.getOpeningTime());
                                dto.setClosingTime(restaurant.getClosingTime());
                                dto.setAddress(restaurant.getAddress());

                                return dto;
                            });
                });
    }


    public Flux<TranslatedRestaurantResponseDTO> getAllTranslatedRestaurants(String targetLang) {
        return restaurantClient.getAllRestaurants()
                .collectList()
                .flatMapMany(restaurants -> {

                    List<String> texts = new ArrayList<>();

                    for (RestaurantResponseDTO restaurant : restaurants) {
                        texts.add(restaurant.getName());
                        texts.add(restaurant.getDescription());
                    }

                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedRestaurantResponseDTO> result =
                                        new ArrayList<>();

                                int i = 0;

                                for (RestaurantResponseDTO restaurant : restaurants) {

                                    TranslatedRestaurantResponseDTO dto =
                                            new TranslatedRestaurantResponseDTO();

                                    dto.setId(restaurant.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPhoneNumber(restaurant.getPhoneNumber());
                                    dto.setEmail(restaurant.getEmail());
                                    dto.setOpen(restaurant.isOpen());
                                    dto.setDeliveryRadiusKm(
                                            restaurant.getDeliveryRadiusKm());
                                    dto.setOpeningTime(
                                            restaurant.getOpeningTime());
                                    dto.setClosingTime(
                                            restaurant.getClosingTime());
                                    dto.setAddress(
                                            restaurant.getAddress());

                                    result.add(dto);
                                }

                                return Flux.fromIterable(result);
                            });
                });
    }

    public Flux<TranslatedRestaurantResponseDTO> searchTranslatedRestaurantsByName(String name, String targetLang) {
        return restaurantClient.searchRestaurantsByName(name)
                .flatMap(restaurant -> translateRestaurant(restaurant, targetLang));
    }


    public Flux<TranslatedRestaurantResponseDTO> getOpenTranslatedRestaurants(String targetLang) {

        return restaurantClient.getOpenRestaurants()
                .collectList()
                .flatMapMany(restaurants -> {

                    List<String> texts = new ArrayList<>();


                    for (RestaurantResponseDTO restaurant : restaurants) {
                        texts.add(restaurant.getName());
                        texts.add(restaurant.getDescription());
                    }


                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedRestaurantResponseDTO> translatedRestaurants =
                                        new ArrayList<>();

                                int i = 0;

                                for (RestaurantResponseDTO restaurant : restaurants) {

                                    TranslatedRestaurantResponseDTO dto =
                                            new TranslatedRestaurantResponseDTO();

                                    dto.setId(restaurant.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPhoneNumber(restaurant.getPhoneNumber());
                                    dto.setEmail(restaurant.getEmail());
                                    dto.setOpen(restaurant.isOpen());
                                    dto.setDeliveryRadiusKm(restaurant.getDeliveryRadiusKm());
                                    dto.setOpeningTime(restaurant.getOpeningTime());
                                    dto.setClosingTime(restaurant.getClosingTime());
                                    dto.setAddress(restaurant.getAddress());

                                    translatedRestaurants.add(dto);
                                }

                                return Flux.fromIterable(translatedRestaurants);
                            });
                });
    }

    public Flux<TranslatedCategoryDTO> getTranslatedCategoriesByRestaurantId(
            Long restaurantId,
            String targetLang
    ) {

        return restaurantClient.getCategoriesByRestaurantId(restaurantId)
                .collectList()
                .flatMapMany(categories -> {

                    List<String> texts = new ArrayList<>();

                    for (CategoryDTO category : categories) {
                        texts.add(category.getName());
                        texts.add(category.getDescription());
                    }

                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedCategoryDTO> translatedCategories =
                                        new ArrayList<>();

                                int i = 0;

                                for (CategoryDTO category : categories) {

                                    TranslatedCategoryDTO dto =
                                            new TranslatedCategoryDTO();

                                    dto.setId(category.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));

                                    translatedCategories.add(dto);
                                }

                                return Flux.fromIterable(translatedCategories);
                            });
                });
    }


    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByCategoryId(
            Long categoryId,
            String targetLang
    ) {

        return restaurantClient.getFoodItemsByCategoryId(categoryId)
                .collectList()
                .flatMapMany(foodItems -> {

                    List<String> texts = new ArrayList<>();


                    for (FoodItemResponseDTO foodItem : foodItems) {
                        texts.add(foodItem.getName());
                        texts.add(foodItem.getDescription());
                    }


                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedFoodItemResponseDTO> translatedFoodItems =
                                        new ArrayList<>();

                                int i = 0;

                                for (FoodItemResponseDTO foodItem : foodItems) {

                                    TranslatedFoodItemResponseDTO dto =
                                            new TranslatedFoodItemResponseDTO();

                                    dto.setId(foodItem.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPrice(foodItem.getPrice());
                                    dto.setAvailable(foodItem.isAvailable());
                                    dto.setPreparationTimeMinutes(foodItem.getPreparationTimeMinutes());
                                    dto.setImageUrl(foodItem.getImageUrl());
                                    dto.setCategoryId(foodItem.getCategoryId());

                                    translatedFoodItems.add(dto);
                                }

                                return Flux.fromIterable(translatedFoodItems);
                            });
                });
    }

    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByRestaurantId(
            Long restaurantId,
            String targetLang
    ) {

        return restaurantClient.getFoodItemsByRestaurantId(restaurantId)
                .collectList()
                .flatMapMany(foodItems -> {

                    List<String> texts = new ArrayList<>();

                    for (FoodItemResponseDTO foodItem : foodItems) {
                        texts.add(foodItem.getName());
                        texts.add(foodItem.getDescription());
                    }

                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedFoodItemResponseDTO> translatedFoodItems =
                                        new ArrayList<>();

                                int i = 0;

                                for (FoodItemResponseDTO foodItem : foodItems) {

                                    TranslatedFoodItemResponseDTO dto =
                                            new TranslatedFoodItemResponseDTO();

                                    dto.setId(foodItem.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPrice(foodItem.getPrice());
                                    dto.setAvailable(foodItem.isAvailable());
                                    dto.setPreparationTimeMinutes(foodItem.getPreparationTimeMinutes());
                                    dto.setImageUrl(foodItem.getImageUrl());
                                    dto.setCategoryId(foodItem.getCategoryId());

                                    translatedFoodItems.add(dto);
                                }

                                return Flux.fromIterable(translatedFoodItems);
                            });
                });
    }

    public Flux<TranslatedFoodItemResponseDTO> searchTranslatedFoodItemsByName(
            String name,
            String targetLang
    ) {

        return restaurantClient.searchFoodItemsByName(name)
                .collectList()
                .flatMapMany(foodItems -> {

                    List<String> texts = new ArrayList<>();

                    for (FoodItemResponseDTO foodItem : foodItems) {
                        texts.add(foodItem.getName());
                        texts.add(foodItem.getDescription());
                    }


                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedFoodItemResponseDTO> translatedFoodItems =
                                        new ArrayList<>();

                                int i = 0;

                                for (FoodItemResponseDTO foodItem : foodItems) {

                                    TranslatedFoodItemResponseDTO dto =
                                            new TranslatedFoodItemResponseDTO();

                                    dto.setId(foodItem.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPrice(foodItem.getPrice());
                                    dto.setAvailable(foodItem.isAvailable());
                                    dto.setPreparationTimeMinutes(foodItem.getPreparationTimeMinutes());
                                    dto.setImageUrl(foodItem.getImageUrl());
                                    dto.setCategoryId(foodItem.getCategoryId());

                                    translatedFoodItems.add(dto);
                                }

                                return Flux.fromIterable(translatedFoodItems);
                            });
                });
    }


    public Flux<TranslatedFoodItemResponseDTO> getAvailableTranslatedFoodItems(
            String targetLang
    ) {

        return restaurantClient.getAvailableFoodItems()
                .collectList()
                .flatMapMany(foodItems -> {

                    List<String> texts = new ArrayList<>();


                    for (FoodItemResponseDTO foodItem : foodItems) {
                        texts.add(foodItem.getName());
                        texts.add(foodItem.getDescription());
                    }


                    return translationClient.translateBatch(texts, targetLang)
                            .flatMapMany(translatedTexts -> {

                                List<TranslatedFoodItemResponseDTO> translatedFoodItems =
                                        new ArrayList<>();

                                int i = 0;

                                for (FoodItemResponseDTO foodItem : foodItems) {

                                    TranslatedFoodItemResponseDTO dto =
                                            new TranslatedFoodItemResponseDTO();

                                    dto.setId(foodItem.getId());
                                    dto.setName(translatedTexts.get(i++));
                                    dto.setDescription(translatedTexts.get(i++));
                                    dto.setPrice(foodItem.getPrice());
                                    dto.setAvailable(foodItem.isAvailable());
                                    dto.setPreparationTimeMinutes(foodItem.getPreparationTimeMinutes());
                                    dto.setImageUrl(foodItem.getImageUrl());
                                    dto.setCategoryId(foodItem.getCategoryId());

                                    translatedFoodItems.add(dto);
                                }

                                return Flux.fromIterable(translatedFoodItems);
                            });
                });
    }


    private Mono<TranslatedRestaurantResponseDTO> translateRestaurant(RestaurantResponseDTO restaurant, String targetLang) {
        Mono<String> translatedName = translationClient.translate(restaurant.getName(), targetLang);
        Mono<String> translatedDescription = translationClient.translate(restaurant.getDescription(), targetLang);

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

}