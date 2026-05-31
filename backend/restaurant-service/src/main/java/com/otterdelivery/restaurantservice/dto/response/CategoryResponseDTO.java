package com.otterdelivery.restaurantservice.dto.response;

import lombok.Data;

@Data
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


}