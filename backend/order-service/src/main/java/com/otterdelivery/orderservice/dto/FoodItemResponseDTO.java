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

}
