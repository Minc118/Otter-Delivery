package com.otterdelivery.profileservice.dto;

public class RecommendationDTO {

    private Long restaurantId;
    private String reason;

    public RecommendationDTO() {
    }

    public RecommendationDTO(Long restaurantId, String reason) {
        this.restaurantId = restaurantId;
        this.reason = reason;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public String getReason() {
        return reason;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}