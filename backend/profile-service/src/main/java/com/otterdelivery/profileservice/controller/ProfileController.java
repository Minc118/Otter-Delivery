package com.otterdelivery.profileservice.controller;

import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.service.ProfileService;
import org.springframework.web.bind.annotation.*;
import com.otterdelivery.profileservice.dto.OrderResponseDTO;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
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
    public Profile getProfileById(@PathVariable Long id) {
        return profileService.getProfileById(id);
    }

    @PutMapping("/{id}")
    public Profile updateProfile(@PathVariable Long id,
                                 @RequestBody Profile profile) {
        return profileService.updateProfile(id, profile);
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
    public Profile loginByUsername(@PathVariable String username) {
        return profileService.getProfileByUsername(username);
    }
}