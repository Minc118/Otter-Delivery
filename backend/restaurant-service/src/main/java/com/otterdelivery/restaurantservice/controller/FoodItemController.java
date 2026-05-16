package com.otterdelivery.restaurantservice.controller;

import com.otterdelivery.restaurantservice.dto.request.FoodItemRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.FoodItemResponseDTO;
import com.otterdelivery.restaurantservice.exception.FoodItemNotFoundException;
import com.otterdelivery.restaurantservice.service.FoodItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food-items")
public class FoodItemController {

    private final FoodItemService foodItemService;

    public FoodItemController(FoodItemService foodItemService) {
        this.foodItemService = foodItemService;
    }

    @PostMapping("/categories/{categoryId}")
    public ResponseEntity<FoodItemResponseDTO> createFoodItem(
            @PathVariable Long categoryId,
            @Valid @RequestBody FoodItemRequestDTO foodItemRequestDTO) {
        FoodItemResponseDTO createdFoodItem = foodItemService.createFoodItem(categoryId, foodItemRequestDTO);
        return ResponseEntity.ok(createdFoodItem);
    }

    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<List<FoodItemResponseDTO>> getFoodItemsByCategory(@PathVariable Long categoryId) {
        List<FoodItemResponseDTO> foodItems = foodItemService.getFoodItemsByCategory(categoryId);
        return ResponseEntity.ok(foodItems);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FoodItemResponseDTO> updateFoodItem(
            @PathVariable Long id,
            @Valid @RequestBody FoodItemRequestDTO foodItemRequestDTO) {
        FoodItemResponseDTO updatedFoodItem = foodItemService.updateFoodItem(id, foodItemRequestDTO);
        return ResponseEntity.ok(updatedFoodItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFoodItem(@PathVariable Long id) {
        foodItemService.deleteFoodItem(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<FoodItemResponseDTO> updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {
        FoodItemResponseDTO updatedFoodItem = foodItemService.updateAvailability(id, available);
        return ResponseEntity.ok(updatedFoodItem);
    }

    @GetMapping("/search")
    public ResponseEntity<List<FoodItemResponseDTO>> searchFoodItems(@RequestParam String name) {
        List<FoodItemResponseDTO> foodItems = foodItemService.searchFoodItems(name);
        return ResponseEntity.ok(foodItems);
    }

    @GetMapping("/available")
    public ResponseEntity<List<FoodItemResponseDTO>> getAvailableFoodItems() {
        List<FoodItemResponseDTO> foodItems = foodItemService.getAvailableFoodItems();
        return ResponseEntity.ok(foodItems);
    }
}