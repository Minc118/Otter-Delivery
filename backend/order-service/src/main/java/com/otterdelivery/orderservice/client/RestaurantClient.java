package com.otterdelivery.orderservice.client;

import com.otterdelivery.orderservice.dto.FoodItemResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RestaurantClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${restaurant.service.url}")
    private String restaurantServiceUrl;

    public FoodItemResponseDTO getFoodItemById(Long id) {
        return restTemplate.getForObject(
                restaurantServiceUrl + "/api/food-items/" + id,
                FoodItemResponseDTO.class
        );
    }
}