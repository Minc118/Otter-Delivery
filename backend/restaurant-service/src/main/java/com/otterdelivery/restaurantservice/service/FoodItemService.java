package com.otterdelivery.restaurantservice.service;

import com.otterdelivery.restaurantservice.dto.request.FoodItemRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.FoodItemResponseDTO;
import java.util.List;

public interface FoodItemService {

    FoodItemResponseDTO createFoodItem(Long categoryId, FoodItemRequestDTO foodItemRequestDTO);

    List<FoodItemResponseDTO> getFoodItemsByCategory(Long categoryId);

    FoodItemResponseDTO updateFoodItem(Long id, FoodItemRequestDTO foodItemRequestDTO);

    void deleteFoodItem(Long id);

    FoodItemResponseDTO updateAvailability(Long id, boolean available);

    List<FoodItemResponseDTO> searchFoodItems(String name);

    List<FoodItemResponseDTO> getAvailableFoodItems();
}