package com.otterdelivery.orderservice.dto;

public class FoodItemResponseDTO {

    private Long id;
    private String name;
    private double price;
    private boolean available;
    private Long categoryId;

    public String getName() {
        return name;
    }
    public double getPrice() {
        return price;
    }
    public boolean isAvailable() {
        return available;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

}
