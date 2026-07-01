package com.otterdelivery.profileservice.config;

import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoProfileSeeder implements ApplicationRunner {

    private final ProfileRepository profileRepository;

    public DemoProfileSeeder(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedProfile(
            "user",
            "Demo",
            "User",
            "demo.user@example.test",
            "+49 30 000000",
            "Invalidenstrasse 116",
            "Berlin",
            "10115"
        );
        seedProfile(
            "sohrab",
            "Sohrab",
            "Demo",
            "sohrab@example.test",
            "+49 30 111111",
            "Unter den Linden 1",
            "Berlin",
            "10117"
        );
        seedProfile(
            "max",
            "Max",
            "Mustermann",
            "max@example.test",
            "+49 30 222222",
            "Alexanderplatz 1",
            "Berlin",
            "10178"
        );
    }

    private void seedProfile(
        String username,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String street,
        String city,
        String postalCode
    ) {
        if (profileRepository.findByUsername(username).isPresent()) {
            return;
        }

        Profile profile = new Profile();
        profile.setUsername(username);
        profile.setFirstName(firstName);
        profile.setLastName(lastName);
        profile.setEmail(email);
        profile.setPhoneNumber(phoneNumber);
        profile.setStreet(street);
        profile.setCity(city);
        profile.setPostalCode(postalCode);
        profileRepository.save(profile);
    }
}
