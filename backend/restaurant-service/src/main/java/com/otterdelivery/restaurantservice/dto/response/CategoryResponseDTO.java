package com.otterdelivery.restaurantservice.dto.response;

import java.util.List;

public class CategoryResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Long restaurantId;


    public CategoryResponseDTO() {}

    public CategoryResponseDTO(Long id, String name, String description, Long restaurantId) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.restaurantId = restaurantId;
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

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }
}