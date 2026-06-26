package com.otterdelivery.translationservice.dtos;

import com.otterdelivery.translationservice.model.AddressDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslatedRestaurantResponseDTO {
    private Long id;
    private String name; // translated
    private String description; // translated
    private String phoneNumber;
    private String email;
    private boolean open;
    private double deliveryRadiusKm;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private AddressDTO address;
    //private List<TranslatedCategoryDTO> categories;
}