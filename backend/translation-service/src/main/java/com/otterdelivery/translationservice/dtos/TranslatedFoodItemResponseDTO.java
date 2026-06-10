package com.otterdelivery.translationservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for translated food item response.
 * Only name and description fields are translated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslatedFoodItemResponseDTO {
    private Long id;
    private String name; // translated
    private String description; // translated
    private java.math.BigDecimal price;
    private boolean available;
    private int preparationTimeMinutes;
    private String imageUrl;
    private Long categoryId;
}