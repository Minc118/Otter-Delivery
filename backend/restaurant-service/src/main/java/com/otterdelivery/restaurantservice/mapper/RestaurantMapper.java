package com.otterdelivery.restaurantservice.mapper;

import com.otterdelivery.restaurantservice.dto.request.RestaurantRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.AddressDTO;
import com.otterdelivery.restaurantservice.dto.response.RestaurantResponseDTO;
import com.otterdelivery.restaurantservice.entity.Address;
import com.otterdelivery.restaurantservice.entity.Restaurant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Component
@Generated({})
public class RestaurantMapper {

    public RestaurantResponseDTO toResponseDTO(Restaurant restaurant) {
        if (restaurant == null) {
            return null;
        }

        AddressDTO addressDTO = null;
        if (restaurant.getAddress() != null) {
            addressDTO = new AddressDTO(
                restaurant.getAddress().getId(),
                restaurant.getAddress().getStreet(),
                restaurant.getAddress().getCity(),
                restaurant.getAddress().getPostalCode(),
                restaurant.getAddress().getCountry(),
                restaurant.getAddress().getLatitude(),
                restaurant.getAddress().getLongitude()
            );
        }

        return new RestaurantResponseDTO(
            restaurant.getId(),
            restaurant.getName(),
            restaurant.getDescription(),
            restaurant.getPhoneNumber(),
            restaurant.getEmail(),
            restaurant.isOpen(),
            restaurant.getDeliveryRadiusKm(),
            restaurant.getOpeningTime(),
            restaurant.getClosingTime(),
            addressDTO
        );
    }

    public Restaurant toEntity(RestaurantRequestDTO requestDTO) {
        if (requestDTO == null) {
            return null;
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName(requestDTO.getName());
        restaurant.setDescription(requestDTO.getDescription());
        restaurant.setPhoneNumber(requestDTO.getPhoneNumber());
        restaurant.setEmail(requestDTO.getEmail());
        restaurant.setOpen(requestDTO.isOpen());
        restaurant.setDeliveryRadiusKm(requestDTO.getDeliveryRadiusKm());
        restaurant.setOpeningTime(requestDTO.getOpeningTime());
        restaurant.setClosingTime(requestDTO.getClosingTime());
        return restaurant;
    }
}