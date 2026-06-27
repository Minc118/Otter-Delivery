package com.otterdelivery.translationservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantRequestDTO {
    private String name;
    private String description;
    private String phoneNumber;
    private String email;
    private boolean open;
    private double deliveryRadiusKm;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private AddressDTO address;
}