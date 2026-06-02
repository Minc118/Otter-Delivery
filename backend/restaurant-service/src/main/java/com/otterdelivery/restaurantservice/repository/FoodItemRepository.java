package com.otterdelivery.restaurantservice.repository;

import com.otterdelivery.restaurantservice.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    List<FoodItem> findByCategoryId(Long categoryId);

    List<FoodItem> findByCategoryIdAndNameIgnoreCase(Long categoryId, String name);

    List<FoodItem> findByAvailableTrue();

    @Query("""
        SELECT f
        FROM FoodItem f
        WHERE f.category.restaurant.id = :restaurantId
    """)
    List<FoodItem> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT f FROM FoodItem f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<FoodItem> findByNameContainingIgnoreCase(@Param("name") String name);
}
