package com.otterdelivery.orderservice.controller;

import com.otterdelivery.orderservice.model.MenuItem;
import com.otterdelivery.orderservice.model.Restaurant;
import com.otterdelivery.orderservice.repository.MenuItemRepository;
import com.otterdelivery.orderservice.repository.RestaurantRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
public class RestaurantController {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantController(RestaurantRepository restaurantRepository,
                                MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @GetMapping
    public List<Restaurant> getRestaurants() {
        return restaurantRepository.findAll();
    }

    @GetMapping("/{restaurantId}/menu")
    public List<MenuItem> getMenuItems(@PathVariable Long restaurantId) {
        return menuItemRepository.findByRestaurantIdAndAvailableTrue(restaurantId);
    }
}