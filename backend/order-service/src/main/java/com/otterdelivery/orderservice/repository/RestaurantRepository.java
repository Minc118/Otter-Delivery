package com.otterdelivery.orderservice.repository;

import com.otterdelivery.orderservice.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
}