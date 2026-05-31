package com.otterdelivery.restaurantservice.dto.response;

import lombok.Data;

import java.math.BigDecimal;@Data
public class FoodItemResponseDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private boolean available;
    private int preparationTimeMinutes;
    private String imageUrl;
    private Long categoryId;


    public FoodItemResponseDTO() {}

    public FoodItemResponseDTO(Long id, String name, String description, BigDecimal price, boolean available,
                               int preparationTimeMinutes, String imageUrl, Long categoryId) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.available = available;
        this.preparationTimeMinutes = preparationTimeMinutes;
        this.imageUrl = imageUrl;
        this.categoryId = categoryId;
    }

}