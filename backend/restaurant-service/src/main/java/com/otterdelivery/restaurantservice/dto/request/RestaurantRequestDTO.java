package com.otterdelivery.restaurantservice.dto.request;

import com.otterdelivery.restaurantservice.dto.response.AddressDTO;
import jakarta.validation.constraints.*;
import java.time.LocalTime;

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
    public AddressDTO getAddress(){
        return address;
    }
    public void setAddress(AddressDTO address){
        this.address=address;
    }
}