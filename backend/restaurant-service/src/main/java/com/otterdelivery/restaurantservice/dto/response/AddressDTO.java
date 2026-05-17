package com.otterdelivery.restaurantservice.dto.response;

import lombok.Data;

@Data
public class AddressDTO {

    private Long id;
    private String street;
    private String city;
    private String postalCode;
    private String country;
    private Double latitude;
    private Double longitude;


    public AddressDTO() {}

    public AddressDTO(Long id, String street, String city, String postalCode, String country, Double latitude, Double longitude) {
        this.id = id;
        this.street = street;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.latitude = latitude;
        this.longitude = longitude;
    }


}