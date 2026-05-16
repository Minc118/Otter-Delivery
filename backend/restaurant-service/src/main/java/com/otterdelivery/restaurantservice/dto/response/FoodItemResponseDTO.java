package com.otterdelivery.restaurantservice.dto.response;

import java.math.BigDecimal;

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


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}