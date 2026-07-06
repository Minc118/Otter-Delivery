package com.otterdelivery.profileservice.controller;

import com.otterdelivery.profileservice.dto.OrderResponseDTO;
import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.service.ProfileService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping
    public Profile createProfile(@RequestBody Profile profile) {
        return profileService.createProfile(profile);
    }

    @GetMapping
    public List<Profile> getAllProfiles() {
        return profileService.getAllProfiles();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfileById(@PathVariable Long id) {
        return ResponseEntity.of(profileService.getProfileById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profile> updateProfile(
        @PathVariable Long id,
        @RequestBody Profile profile
    ) {
        return ResponseEntity.of(profileService.updateProfile(id, profile));
    }

    @DeleteMapping("/{id}")
    public void deleteProfile(@PathVariable Long id) {
        profileService.deleteProfile(id);
    }

    @GetMapping("/{id}/orders")
    public List<OrderResponseDTO> getOrdersForProfile(@PathVariable Long id) {
        return profileService.getOrdersForProfile(id);
    }

    @GetMapping("/login/{username}")
    public ResponseEntity<Profile> loginByUsername(@PathVariable String username) {
        return ResponseEntity.of(profileService.getProfileByUsername(username));
    }
}
