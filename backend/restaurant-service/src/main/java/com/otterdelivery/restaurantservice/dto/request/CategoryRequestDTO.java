package com.otterdelivery.restaurantservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequestDTO {

    @NotBlank
    private String name;

    @Size(max = 500)
    private String description;

    public CategoryRequestDTO() {}

    public CategoryRequestDTO(String name, String description) {
        this.name = name;
        this.description = description;
    }

}