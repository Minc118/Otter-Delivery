package com.otterdelivery.restaurantservice.service.impl;

import com.otterdelivery.restaurantservice.dto.request.CategoryRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.CategoryResponseDTO;
import com.otterdelivery.restaurantservice.entity.Category;
import com.otterdelivery.restaurantservice.entity.Restaurant;
import com.otterdelivery.restaurantservice.exception.CategoryNotFoundException;
import com.otterdelivery.restaurantservice.exception.RestaurantNotFoundException;
import com.otterdelivery.restaurantservice.mapper.CategoryMapper;
import com.otterdelivery.restaurantservice.repository.CategoryRepository;
import com.otterdelivery.restaurantservice.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements com.otterdelivery.restaurantservice.service.CategoryService {

    private final CategoryRepository categoryRepository;
    private final RestaurantRepository restaurantRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, RestaurantRepository restaurantRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.restaurantRepository = restaurantRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    @Transactional
    public CategoryResponseDTO createCategory(Long restaurantId, CategoryRequestDTO categoryRequestDTO) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + restaurantId));

        Category category = categoryMapper.toEntity(categoryRequestDTO);
        category.setRestaurant(restaurant);
        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toResponseDTO(savedCategory);
    }

    @Override
    public List<CategoryResponseDTO> getCategoriesByRestaurant(Long restaurantId) {
        // Check if restaurant exists first
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + restaurantId));
        List<Category> categories = categoryRepository.findByRestaurantId(restaurantId);
        return categories.stream()
                .map(categoryMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO categoryRequestDTO) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));

        // Update fields
        existingCategory.setName(categoryRequestDTO.getName());
        existingCategory.setDescription(categoryRequestDTO.getDescription());

        Category updatedCategory = categoryRepository.save(existingCategory);
        return categoryMapper.toResponseDTO(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }
}