package com.otterdelivery.restaurantservice.service.impl;

import com.otterdelivery.restaurantservice.dto.request.RestaurantRequestDTO;
import com.otterdelivery.restaurantservice.dto.response.RestaurantResponseDTO;
import com.otterdelivery.restaurantservice.entity.Address;
import com.otterdelivery.restaurantservice.entity.Restaurant;
import com.otterdelivery.restaurantservice.mapper.RestaurantMapper;
import com.otterdelivery.restaurantservice.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import com.otterdelivery.restaurantservice.exception.RestaurantNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantServiceImpl implements com.otterdelivery.restaurantservice.service.RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository, RestaurantMapper restaurantMapper) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantMapper = restaurantMapper;
    }

    @Override
    @Transactional
    public RestaurantResponseDTO createRestaurant(RestaurantRequestDTO restaurantRequestDTO) {
        Restaurant restaurant = restaurantMapper.toEntity(restaurantRequestDTO);
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return restaurantMapper.toResponseDTO(savedRestaurant);
    }

    @Override
    public RestaurantResponseDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + id));
        return restaurantMapper.toResponseDTO(restaurant);
    }

    @Override
    public List<RestaurantResponseDTO> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return restaurants.stream()
                .map(restaurantMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RestaurantResponseDTO updateRestaurant(Long id, RestaurantRequestDTO restaurantRequestDTO) {
        Restaurant existingRestaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + id));


        existingRestaurant.setName(restaurantRequestDTO.getName());
        existingRestaurant.setDescription(restaurantRequestDTO.getDescription());
        existingRestaurant.setPhoneNumber(restaurantRequestDTO.getPhoneNumber());
        existingRestaurant.setEmail(restaurantRequestDTO.getEmail());
        existingRestaurant.setOpen(restaurantRequestDTO.isOpen());
        existingRestaurant.setDeliveryRadiusKm(restaurantRequestDTO.getDeliveryRadiusKm());
        existingRestaurant.setOpeningTime(restaurantRequestDTO.getOpeningTime());
        existingRestaurant.setClosingTime(restaurantRequestDTO.getClosingTime());

        Restaurant updatedRestaurant = restaurantRepository.save(existingRestaurant);
        return restaurantMapper.toResponseDTO(updatedRestaurant);
    }

    @Override
    @Transactional
    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + id));
        restaurantRepository.delete(restaurant);
    }

    @Override
    @Transactional
    public RestaurantResponseDTO updateRestaurantStatus(Long id, boolean open) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found with id: " + id));
        restaurant.setOpen(open);
        Restaurant updatedRestaurant = restaurantRepository.save(restaurant);
        return restaurantMapper.toResponseDTO(updatedRestaurant);
    }

    @Override
    public List<RestaurantResponseDTO> searchRestaurants(String name) {
        List<Restaurant> restaurants = restaurantRepository.findByNameContainingIgnoreCase(name);
        return restaurants.stream()
                .map(restaurantMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<RestaurantResponseDTO> getOpenRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findByOpenTrue();
        return restaurants.stream()
                .map(restaurantMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}