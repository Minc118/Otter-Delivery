package com.otterdelivery.restaurantservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
@Data
public class FoodItemRequestDTO {

    @NotBlank
    private String name;

    @Size(max = 1000)
    private String description;

    @NotNull
    private BigDecimal price;

    private boolean available;

    @NotNull
    private int preparationTimeMinutes;

    @Size(max = 500)
    private String imageUrl;


    public FoodItemRequestDTO() {}

    public FoodItemRequestDTO(String name, String description, BigDecimal price, boolean available, int preparationTimeMinutes, String imageUrl) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.available = available;
        this.preparationTimeMinutes = preparationTimeMinutes;
        this.imageUrl = imageUrl;
    }



}