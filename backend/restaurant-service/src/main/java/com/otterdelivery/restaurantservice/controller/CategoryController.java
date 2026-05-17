package com.otterdelivery.restaurantservice.controller;

import com.otterdelivery.restaurantservice.dto.request.CategoryRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.CategoryResponseDTO;
import com.otterdelivery.restaurantservice.exception.CategoryNotFoundException;
import com.otterdelivery.restaurantservice.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping("/restaurants/{restaurantId}")
    public ResponseEntity<CategoryResponseDTO> createCategory(
            @PathVariable("restaurantId") Long restaurantId,
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO) {
        CategoryResponseDTO createdCategory = categoryService.createCategory(restaurantId, categoryRequestDTO);
        return ResponseEntity.ok(createdCategory);
    }

    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<List<CategoryResponseDTO>> getCategoriesByRestaurant(@PathVariable Long restaurantId) {
        List<CategoryResponseDTO> categories = categoryService.getCategoriesByRestaurant(restaurantId);
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDTO categoryRequestDTO) {
        CategoryResponseDTO updatedCategory = categoryService.updateCategory(id, categoryRequestDTO);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}