package com.otterdelivery.restaurantservice.dto.request;

import com.otterdelivery.restaurantservice.dto.response.AddressDTO;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;
@Data
public class RestaurantRequestDTO {

    @NotBlank
    private String name;

    @Size(max = 1000)
    private String description;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number should be valid")
    private String phoneNumber;

    @Email
    private String email;

    private boolean open;

    @PositiveOrZero
    private double deliveryRadiusKm;

    @NotNull
    private LocalTime openingTime;

    @NotNull
    private LocalTime closingTime;

    @NotNull
    private AddressDTO address;

    public RestaurantRequestDTO() {}

    public RestaurantRequestDTO(String name, String description, String phoneNumber, String email, boolean open,
                                double deliveryRadiusKm, LocalTime openingTime, LocalTime closingTime, AddressDTO address) {
        this.name = name;
        this.description = description;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.open = open;
        this.deliveryRadiusKm = deliveryRadiusKm;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.address= address;
    }

}