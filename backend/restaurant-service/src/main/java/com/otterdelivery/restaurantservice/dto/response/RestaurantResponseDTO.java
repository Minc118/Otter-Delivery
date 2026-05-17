package com.otterdelivery.restaurantservice.dto.response;

import lombok.Data;

import java.time.LocalTime;
@Data
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

}