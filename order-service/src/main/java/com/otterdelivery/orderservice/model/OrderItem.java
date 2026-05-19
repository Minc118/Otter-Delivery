package com.otterdelivery.orderservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(name = "item_name")
    private String itemName;

    private int quantity;

    @Column(name = "price_at_order_time")
    private double priceAtOrderTime;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    public OrderItem() {
    }

    public OrderItem(Long menuItemId, String itemName, int quantity, double priceAtOrderTime) {
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.priceAtOrderTime = priceAtOrderTime;
    }

    public double calculateSubtotal() {
        return quantity * priceAtOrderTime;
    }

    public Long getId() { return id; }
    public Long getMenuItemId() { return menuItemId; }
    public String getItemName() { return itemName; }
    public int getQuantity() { return quantity; }
    public double getPriceAtOrderTime() { return priceAtOrderTime; }
    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public void setPriceAtOrderTime(double priceAtOrderTime) {
        this.priceAtOrderTime = priceAtOrderTime;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }
}