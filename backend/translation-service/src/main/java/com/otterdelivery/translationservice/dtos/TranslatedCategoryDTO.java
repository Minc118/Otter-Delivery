package com.otterdelivery.translationservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for translated category.
 * Only name and description fields are translated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslatedCategoryDTO {
    private Long id;
    private String name; // translated
    private String description; // translated
}