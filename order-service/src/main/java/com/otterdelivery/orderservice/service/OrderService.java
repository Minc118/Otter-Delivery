package com.otterdelivery.orderservice.service;

import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
import com.otterdelivery.orderservice.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order placeOrder(Long customerId,
                            Long restaurantId,
                            List<OrderItem> items) {

        if (items == null || items.isEmpty()) {
            return null;
        }

        Order order = new Order(customerId, restaurantId, items);

        for (OrderItem item : items) {
            item.setOrder(order);
        }

        return orderRepository.save(order);
    }

    public Order getOrderById(Long orderId) {

        return orderRepository.findById(orderId)
                .orElse(null);
    }

    public Order updateOrder(Long orderId,
                             List<OrderItem> items) {

        Order order = getOrderById(orderId);

        if (order == null) {
            return null;
        }

        if (!order.isEditable()) {
            return null;
        }

        if (items == null || items.isEmpty()) {
            return null;
        }

        for (OrderItem item : items) {
            item.setOrder(order);
        }

        order.updateItems(items);

        return orderRepository.save(order);
    }
}