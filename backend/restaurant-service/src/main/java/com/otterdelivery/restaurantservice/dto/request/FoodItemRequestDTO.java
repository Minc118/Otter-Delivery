package com.otterdelivery.restaurantservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

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


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public int getPreparationTimeMinutes() {
        return preparationTimeMinutes;
    }

    public void setPreparationTimeMinutes(int preparationTimeMinutes) {
        this.preparationTimeMinutes = preparationTimeMinutes;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}