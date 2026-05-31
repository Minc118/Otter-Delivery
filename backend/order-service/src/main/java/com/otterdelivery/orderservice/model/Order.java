package com.otterdelivery.orderservice.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;
    private Long restaurantId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private double totalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "order_id")
    @JsonManagedReference
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }

    public Order(Long customerId, Long restaurantId, List<OrderItem> items) {
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.items = items;
        this.status = OrderStatus.CREATED;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.totalPrice = calculateTotalPrice();
    }

    public double calculateTotalPrice() {
        double total = 0;

        for (OrderItem item : items) {
            total += item.calculateSubtotal();
        }

        return total;
    }

    public void updateItems(List<OrderItem> newItems) {
        this.items = newItems;
        this.totalPrice = calculateTotalPrice();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isEditable() {
        return status == OrderStatus.CREATED;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public Long getRestaurantId() { return restaurantId; }
    public OrderStatus getStatus() { return status; }
    public double getTotalPrice() { return totalPrice; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<OrderItem> getItems() { return items; }

    public void setStatus(OrderStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}