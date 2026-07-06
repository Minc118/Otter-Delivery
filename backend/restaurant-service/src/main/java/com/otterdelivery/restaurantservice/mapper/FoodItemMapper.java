package com.otterdelivery.restaurantservice.mapper;

import com.otterdelivery.restaurantservice.dto.request.FoodItemRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.FoodItemResponseDTO;
import com.otterdelivery.restaurantservice.entity.FoodItem;
import org.springframework.stereotype.Component;

@Component
public class FoodItemMapper {

    public FoodItemResponseDTO toResponseDTO(FoodItem foodItem) {
        if (foodItem == null) {
            return null;
        }

        String categoryName = null;
        java.util.List<String> tags = new java.util.ArrayList<>();
        if (foodItem.getCategory() != null) {
            categoryName = foodItem.getCategory().getName();
            tags.add(categoryName);
            if (foodItem.getCategory().getDescription() != null) {
                for (String part : foodItem.getCategory().getDescription().split(",")) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        tags.add(trimmed.toLowerCase());
                    }
                }
            }
        }

        return new FoodItemResponseDTO(
            foodItem.getId(),
            foodItem.getName(),
            foodItem.getDescription(),
            foodItem.getPrice(),
            foodItem.isAvailable(),
            foodItem.getPreparationTimeMinutes(),
            foodItem.getImageUrl(),
            foodItem.getCategory() != null ? foodItem.getCategory().getId() : null,
            categoryName,
            tags
        );
    }

    public FoodItem toEntity(FoodItemRequestDTO requestDTO) {
        if (requestDTO == null) {
            return null;
        }

        FoodItem foodItem = new FoodItem();
        foodItem.setName(requestDTO.getName());
        foodItem.setDescription(requestDTO.getDescription());
        foodItem.setPrice(requestDTO.getPrice());
        foodItem.setAvailable(requestDTO.isAvailable());
        foodItem.setPreparationTimeMinutes(requestDTO.getPreparationTimeMinutes());
        foodItem.setImageUrl(requestDTO.getImageUrl());
        return foodItem;
    }
}