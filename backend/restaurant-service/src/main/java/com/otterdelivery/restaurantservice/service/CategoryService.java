package com.otterdelivery.restaurantservice.service;

import com.otterdelivery.restaurantservice.dto.request.CategoryRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.CategoryResponseDTO;
import java.util.List;

public interface CategoryService {

    CategoryResponseDTO createCategory(Long restaurantId, CategoryRequestDTO categoryRequestDTO);

    List<CategoryResponseDTO> getCategoriesByRestaurant(Long restaurantId);

    CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO categoryRequestDTO);

    void deleteCategory(Long id);
}