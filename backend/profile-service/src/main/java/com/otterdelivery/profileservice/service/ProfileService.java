package com.otterdelivery.profileservice.service;

import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import jakarta.persistence.Column;
import org.springframework.stereotype.Service;
import com.otterdelivery.profileservice.dto.OrderResponseDTO;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;
import com.otterdelivery.profileservice.dto.RecommendationDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    @Column(unique = true, nullable = false)
    private String username;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public Profile createProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    public Profile getProfileById(Long id) {
        return profileRepository.findById(id).orElse(null);
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Profile updateProfile(Long id, Profile newProfileData) {
        Profile profile = getProfileById(id);

        if (profile == null) {
            return null;
        }

        profile.setFirstName(newProfileData.getFirstName());
        profile.setLastName(newProfileData.getLastName());
        profile.setUsername(newProfileData.getUsername());
        profile.setEmail(newProfileData.getEmail());
        profile.setPhoneNumber(newProfileData.getPhoneNumber());
        profile.setStreet(newProfileData.getStreet());
        profile.setCity(newProfileData.getCity());
        profile.setPostalCode(newProfileData.getPostalCode());

        return profileRepository.save(profile);
    }

    private final RestTemplate restTemplate = new RestTemplate();

    public List<OrderResponseDTO> getOrdersForProfile(Long profileId) {
        String url = "http://localhost:8002/orders/customer/" + profileId;

        OrderResponseDTO[] orders =
                restTemplate.getForObject(url, OrderResponseDTO[].class);

        if (orders == null) {
            return List.of();
        }

        return Arrays.asList(orders);
    }

    public void deleteProfile(Long id) {
        profileRepository.deleteById(id);
    }

    public List<RecommendationDTO> getRecommendationsForProfile(Long profileId) {
        List<OrderResponseDTO> orders = getOrdersForProfile(profileId);

        Map<Long, Integer> restaurantCounter = new HashMap<>();

        for (OrderResponseDTO order : orders) {
            Long restaurantId = order.getRestaurantId();

            if (restaurantId != null) {
                restaurantCounter.put(
                        restaurantId,
                        restaurantCounter.getOrDefault(restaurantId, 0) + 1
                );
            }
        }

        List<RecommendationDTO> recommendations = new ArrayList<>();

        restaurantCounter.entrySet()
                .stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(3)
                .forEach(entry -> {
                    recommendations.add(
                            new RecommendationDTO(
                                    entry.getKey(),
                                    "Because this is one of your most ordered restaurants"
                            )
                    );
                });

        return recommendations;
    }

    public Profile getProfileByUsername(String username) {
        return profileRepository.findByUsername(username).orElse(null);
    }
}