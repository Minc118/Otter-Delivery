package com.otterdelivery.orderservice.dto;

import com.otterdelivery.orderservice.model.OrderItem;
import java.util.List;

public class CreateOrderRequest {

    private Long customerId;
    private Long restaurantId;
    private List<OrderItem> items;

    public Long getCustomerId() {
        return customerId;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
}