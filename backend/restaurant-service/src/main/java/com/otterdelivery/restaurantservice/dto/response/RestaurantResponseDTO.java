package com.otterdelivery.restaurantservice.dto.response;

import java.time.LocalTime;

public class RestaurantResponseDTO {

    private Long id;
    private String name;
    private String description;
    private String phoneNumber;
    private String email;
    private boolean open;
    private double deliveryRadiusKm;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private AddressDTO address;


    public RestaurantResponseDTO() {}

    public RestaurantResponseDTO(Long id, String name, String description, String phoneNumber, String email, boolean open,
                                 double deliveryRadiusKm, LocalTime openingTime, LocalTime closingTime, AddressDTO address) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.open = open;
        this.deliveryRadiusKm = deliveryRadiusKm;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.address = address;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isOpen() {
        return open;
    }

    public void setOpen(boolean open) {
        this.open = open;
    }

    public double getDeliveryRadiusKm() {
        return deliveryRadiusKm;
    }

    public void setDeliveryRadiusKm(double deliveryRadiusKm) {
        this.deliveryRadiusKm = deliveryRadiusKm;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(LocalTime openingTime) {
        this.openingTime = openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(LocalTime closingTime) {
        this.closingTime = closingTime;
    }

    public AddressDTO getAddress() {
        return address;
    }

    public void setAddress(AddressDTO address) {
        this.address = address;
    }
}