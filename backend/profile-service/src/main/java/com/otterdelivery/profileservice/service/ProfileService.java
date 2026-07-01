package com.otterdelivery.profileservice.service;

import com.otterdelivery.profileservice.dto.OrderResponseDTO;
import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class ProfileService {

    private final String orderServiceUrl;
    private final ProfileRepository profileRepository;
    private final RestTemplate restTemplate;

    public ProfileService(
        ProfileRepository profileRepository,
        @Value("${order.service.url}") String orderServiceUrl
    ) {
        this.profileRepository = profileRepository;
        this.orderServiceUrl = orderServiceUrl;
        this.restTemplate = new RestTemplate();
    }

    public Profile createProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    public Optional<Profile> getProfileById(Long id) {
        return profileRepository.findById(id);
    }

    public Optional<Profile> updateProfile(Long id, Profile newProfileData) {
        return profileRepository.findById(id).map(profile -> {
            profile.setFirstName(newProfileData.getFirstName());
            profile.setLastName(newProfileData.getLastName());
            profile.setUsername(newProfileData.getUsername());
            profile.setEmail(newProfileData.getEmail());
            profile.setPhoneNumber(newProfileData.getPhoneNumber());
            profile.setStreet(newProfileData.getStreet());
            profile.setCity(newProfileData.getCity());
            profile.setPostalCode(newProfileData.getPostalCode());
            return profileRepository.save(profile);
        });
    }

    public List<OrderResponseDTO> getOrdersForProfile(Long profileId) {
        String url = orderServiceUrl + "/orders/customer/" + profileId;

        try {
            OrderResponseDTO[] orders =
                restTemplate.getForObject(url, OrderResponseDTO[].class);
            return orders == null ? List.of() : Arrays.asList(orders);
        } catch (RestClientException error) {
            return List.of();
        }
    }

    public void deleteProfile(Long id) {
        profileRepository.deleteById(id);
    }

    public Optional<Profile> getProfileByUsername(String username) {
        return profileRepository.findByUsername(username);
    }
}
