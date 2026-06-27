package com.otterdelivery.translationservice.controller;


import com.otterdelivery.translationservice.dtos.*;
import com.otterdelivery.translationservice.service.TranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;



@RestController
@RequestMapping("/api/translations")
@RequiredArgsConstructor
@Slf4j
public class TranslationController {

    private final TranslationService translationService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Translation service is healthy");
    }

    @GetMapping("/restaurants/{id}")
    public Mono<ResponseEntity<TranslatedRestaurantResponseDTO>> getTranslatedRestaurantById(
            @PathVariable Long id,
            @RequestParam String lang) {
        return translationService.getTranslatedRestaurantById(id, lang)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/restaurants")
    public Flux<TranslatedRestaurantResponseDTO> getAllTranslatedRestaurants(
            @RequestParam String lang) {
        return translationService.getAllTranslatedRestaurants(lang);
    }

    @GetMapping("/restaurants/search")
    public Flux<TranslatedRestaurantResponseDTO> searchTranslatedRestaurantsByName(
            @RequestParam String name,
            @RequestParam String lang) {
        return translationService.searchTranslatedRestaurantsByName(name, lang);
    }


    @GetMapping("/restaurants/open")
    public Flux<TranslatedRestaurantResponseDTO> getOpenTranslatedRestaurants(
            @RequestParam String lang) {
        return translationService.getOpenTranslatedRestaurants(lang);
    }


    @GetMapping("/restaurants/{restaurantId}/categories")
    public Flux<TranslatedCategoryDTO> getTranslatedCategoriesByRestaurantId(
            @PathVariable Long restaurantId,
            @RequestParam String lang) {
        return translationService.getTranslatedCategoriesByRestaurantId(restaurantId, lang);
    }


    @GetMapping("/categories/{categoryId}/food-items")
    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByCategoryId(
            @PathVariable Long categoryId,
            @RequestParam String lang) {
        return translationService.getTranslatedFoodItemsByCategoryId(categoryId, lang);
    }


    @GetMapping("/restaurants/{restaurantId}/food-items")
    public Flux<TranslatedFoodItemResponseDTO> getTranslatedFoodItemsByRestaurantId(
            @PathVariable Long restaurantId,
            @RequestParam String lang) {
        return translationService.getTranslatedFoodItemsByRestaurantId(restaurantId, lang);
    }

    @GetMapping("/food-items/search")
    public Flux<TranslatedFoodItemResponseDTO> searchTranslatedFoodItemsByName(
            @RequestParam String name,
            @RequestParam String lang) {
        return translationService.searchTranslatedFoodItemsByName(name, lang);
    }


    @GetMapping("/food-items/available")
    public Flux<TranslatedFoodItemResponseDTO> getAvailableTranslatedFoodItems(
            @RequestParam String lang) {
        return translationService.getAvailableTranslatedFoodItems(lang);
    }
}