package com.otterdelivery.orderservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    private Long id;

    private Long restaurantId;
    private String name;
    private double price;
    private boolean available;

    public MenuItem() {
    }

    public MenuItem(Long id, Long restaurantId, String name, double price, boolean available) {
        this.id = id;
        this.restaurantId = restaurantId;
        this.name = name;
        this.price = price;
        this.available = available;
    }

    public Long getId() { return id; }
    public Long getRestaurantId() { return restaurantId; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public boolean isAvailable() { return available; }
}