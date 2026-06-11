package com.otterdelivery.translationservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslatedCategoryDTO {
    private Long id;
    private String name;
    private String description;
}