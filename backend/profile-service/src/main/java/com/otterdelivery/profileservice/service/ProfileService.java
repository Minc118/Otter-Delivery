package com.otterdelivery.profileservice.service;

import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import com.otterdelivery.profileservice.dto.OrderResponseDTO;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

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

    public Profile updateProfile(Long id, Profile newProfileData) {
        Profile profile = getProfileById(id);

        if (profile == null) {
            return null;
        }

        profile.setFirstName(newProfileData.getFirstName());
        profile.setLastName(newProfileData.getLastName());
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
}