package com.otterdelivery.translationservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslatedFoodItemResponseDTO {
    private Long id;
    private String name;
    private String description;
    private java.math.BigDecimal price;
    private boolean available;
    private int preparationTimeMinutes;
    private String imageUrl;
    private Long categoryId;
}