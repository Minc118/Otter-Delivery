package com.otterdelivery.orderservice.repository;

import com.otterdelivery.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}