package com.otterdelivery.restaurantservice.mapper;

import com.otterdelivery.restaurantservice.dto.request.CategoryRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.CategoryResponseDTO;
import com.otterdelivery.restaurantservice.entity.Category;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Component
@Generated({})
public class CategoryMapper {

    public CategoryResponseDTO toResponseDTO(Category category) {
        if (category == null) {
            return null;
        }

        return new CategoryResponseDTO(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getRestaurant() != null ? category.getRestaurant().getId() : null
        );
    }

    public Category toEntity(CategoryRequestDTO requestDTO) {
        if (requestDTO == null) {
            return null;
        }

        Category category = new Category();
        category.setName(requestDTO.getName());
        category.setDescription(requestDTO.getDescription());
        return category;
    }
}