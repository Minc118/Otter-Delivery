package com.otterdelivery.orderservice.service;

import com.otterdelivery.orderservice.model.Order;
import com.otterdelivery.orderservice.model.OrderItem;
import com.otterdelivery.orderservice.model.OrderStatus;
import com.otterdelivery.orderservice.repository.OrderRepository;
import org.springframework.stereotype.Service;
import com.otterdelivery.orderservice.client.RestaurantClient;
import com.otterdelivery.orderservice.dto.FoodItemResponseDTO;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantClient restaurantClient;

    public OrderService(OrderRepository orderRepository, RestaurantClient restaurantClient) {
        this.orderRepository = orderRepository;
        this.restaurantClient = restaurantClient;
    }

    public Order placeOrder(Long customerId,
                            Long restaurantId,
                            List<OrderItem> items) {

        if (items == null || items.isEmpty()) {
            return null;
        }

        for (OrderItem item : items) {
            FoodItemResponseDTO foodItem =
                    restaurantClient.getFoodItemById(item.getMenuItemId());

            if (foodItem == null || !foodItem.isAvailable()) {
                return null;
            }

            item.setItemName(foodItem.getName());
            item.setPriceAtOrderTime(foodItem.getPrice());
        }

        Order order = new Order(customerId, restaurantId, items);

        for (OrderItem item : items) {
            item.setOrder(order);
        }

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
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

    public Order updateStatus(Long id, OrderStatus status) {
        Order order = getOrderById(id);

        if (order == null) {
            return null;
        }

        order.setStatus(status);
        return orderRepository.save(order);
    }

    public List<Order> getOrdersByCustomerId(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }
}