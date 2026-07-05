package com.otterdelivery.orderservice.repository;

import com.otterdelivery.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
