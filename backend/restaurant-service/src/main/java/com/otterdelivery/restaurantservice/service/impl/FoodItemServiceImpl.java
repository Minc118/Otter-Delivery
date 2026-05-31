package com.otterdelivery.restaurantservice.service.impl;

import com.otterdelivery.restaurantservice.dto.request.FoodItemRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.FoodItemResponseDTO;
import com.otterdelivery.restaurantservice.entity.Category;
import com.otterdelivery.restaurantservice.entity.FoodItem;
import com.otterdelivery.restaurantservice.exception.CategoryNotFoundException;
import com.otterdelivery.restaurantservice.exception.FoodItemNotFoundException;
import com.otterdelivery.restaurantservice.mapper.FoodItemMapper;
import com.otterdelivery.restaurantservice.repository.CategoryRepository;
import com.otterdelivery.restaurantservice.repository.FoodItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FoodItemServiceImpl implements com.otterdelivery.restaurantservice.service.FoodItemService {

    private final FoodItemRepository foodItemRepository;
    private final CategoryRepository categoryRepository;
    private final FoodItemMapper foodItemMapper;

    public FoodItemServiceImpl(FoodItemRepository foodItemRepository, CategoryRepository categoryRepository, FoodItemMapper foodItemMapper) {
        this.foodItemRepository = foodItemRepository;
        this.categoryRepository = categoryRepository;
        this.foodItemMapper = foodItemMapper;
    }

    @Override
    @Transactional
    public FoodItemResponseDTO createFoodItem(Long categoryId, FoodItemRequestDTO foodItemRequestDTO) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + categoryId));

        FoodItem foodItem = foodItemMapper.toEntity(foodItemRequestDTO);
        foodItem.setCategory(category);
        FoodItem savedFoodItem = foodItemRepository.save(foodItem);
        return foodItemMapper.toResponseDTO(savedFoodItem);
    }

    @Override
    public List<FoodItemResponseDTO> getFoodItemsByCategory(Long categoryId) {
        // Check if category exists first
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + categoryId));
        List<FoodItem> foodItems = foodItemRepository.findByCategoryId(categoryId);
        return foodItems.stream()
                .map(foodItemMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FoodItemResponseDTO updateFoodItem(Long id, FoodItemRequestDTO foodItemRequestDTO) {
        FoodItem existingFoodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new FoodItemNotFoundException("FoodItem not found with id: " + id));

        existingFoodItem.setName(foodItemRequestDTO.getName());
        existingFoodItem.setDescription(foodItemRequestDTO.getDescription());
        existingFoodItem.setPrice(foodItemRequestDTO.getPrice());
        existingFoodItem.setAvailable(foodItemRequestDTO.isAvailable());
        existingFoodItem.setPreparationTimeMinutes(foodItemRequestDTO.getPreparationTimeMinutes());
        existingFoodItem.setImageUrl(foodItemRequestDTO.getImageUrl());

        FoodItem updatedFoodItem = foodItemRepository.save(existingFoodItem);
        return foodItemMapper.toResponseDTO(updatedFoodItem);
    }

    @Override
    @Transactional
    public void deleteFoodItem(Long id) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new FoodItemNotFoundException("FoodItem not found with id: " + id));
        foodItemRepository.delete(foodItem);
    }

    @Override
    @Transactional
    public FoodItemResponseDTO updateAvailability(Long id, boolean available) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new FoodItemNotFoundException("FoodItem not found with id: " + id));
        foodItem.setAvailable(available);
        FoodItem updatedFoodItem = foodItemRepository.save(foodItem);
        return foodItemMapper.toResponseDTO(updatedFoodItem);
    }

    @Override
    public List<FoodItemResponseDTO> searchFoodItems(String name) {
        List<FoodItem> foodItems = foodItemRepository.findByNameContainingIgnoreCase(name);
        return foodItems.stream()
                .map(foodItemMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<FoodItemResponseDTO> getAvailableFoodItems() {
        List<FoodItem> foodItems = foodItemRepository.findByAvailableTrue();
        return foodItems.stream()
                .map(foodItemMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FoodItemResponseDTO getFoodItemById(Long id) {

        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() ->
                        new FoodItemNotFoundException("Food item not found with id: " + id));

        return foodItemMapper.toResponseDTO(foodItem);
    }

    public List<FoodItemResponseDTO> getFoodItemsByRestaurant(Long restaurantId) {

        List<FoodItem> foodItems =
                foodItemRepository.findByRestaurantId(restaurantId);

        return foodItems.stream()
                .map(foodItemMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}