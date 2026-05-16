package com.otterdelivery.restaurantservice.service;

import com.otterdelivery.restaurantservice.dto.request.RestaurantRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.RestaurantResponseDTO;
import java.util.List;

public interface RestaurantService {

    RestaurantResponseDTO createRestaurant(RestaurantRequestDTO restaurantRequestDTO);

    RestaurantResponseDTO getRestaurantById(Long id);

    List<RestaurantResponseDTO> getAllRestaurants();

    RestaurantResponseDTO updateRestaurant(Long id, RestaurantRequestDTO restaurantRequestDTO);

    void deleteRestaurant(Long id);

    RestaurantResponseDTO updateRestaurantStatus(Long id, boolean open);

    List<RestaurantResponseDTO> searchRestaurants(String name);

    List<RestaurantResponseDTO> getOpenRestaurants();
}