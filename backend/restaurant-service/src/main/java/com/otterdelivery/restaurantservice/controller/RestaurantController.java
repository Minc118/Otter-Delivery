package com.otterdelivery.restaurantservice.controller;

import com.otterdelivery.restaurantservice.dto.request.RestaurantRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.RestaurantResponseDTO;
import com.otterdelivery.restaurantservice.exception.RestaurantNotFoundException;
import com.otterdelivery.restaurantservice.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    public ResponseEntity<RestaurantResponseDTO> createRestaurant(@Valid @RequestBody RestaurantRequestDTO restaurantRequestDTO) {
        RestaurantResponseDTO createdRestaurant = restaurantService.createRestaurant(restaurantRequestDTO);
        return ResponseEntity.ok(createdRestaurant);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> getRestaurantById(@PathVariable("id")  Long id) {
        RestaurantResponseDTO restaurant = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(restaurant);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantResponseDTO>> getAllRestaurants() {
        List<RestaurantResponseDTO> restaurants = restaurantService.getAllRestaurants();
        return ResponseEntity.ok(restaurants);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantResponseDTO> updateRestaurant(@PathVariable("id")  Long id, @Valid @RequestBody RestaurantRequestDTO restaurantRequestDTO) {
        RestaurantResponseDTO updatedRestaurant = restaurantService.updateRestaurant(id, restaurantRequestDTO);
        return ResponseEntity.ok(updatedRestaurant);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable("id")  Long id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RestaurantResponseDTO> updateRestaurantStatus(@PathVariable("id")  Long id, @RequestParam("open") boolean open) {
        RestaurantResponseDTO updatedRestaurant = restaurantService.updateRestaurantStatus(id, open);
        return ResponseEntity.ok(updatedRestaurant);
    }

    @GetMapping("/search")
    public ResponseEntity<List<RestaurantResponseDTO>> searchRestaurants(@RequestParam("name") String name) {
        List<RestaurantResponseDTO> restaurants = restaurantService.searchRestaurants(name);
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/open")
    public ResponseEntity<List<RestaurantResponseDTO>> getOpenRestaurants() {
        List<RestaurantResponseDTO> restaurants = restaurantService.getOpenRestaurants();
        return ResponseEntity.ok(restaurants);
    }
}