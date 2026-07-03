package com.otterdelivery.profileservice.config;

import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import java.math.BigDecimal;
import java.util.List;
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
            "10115",
            List.of("Italian"),
            List.of("Vegetarian"),
            List.of(),
            List.of(),
            new BigDecimal("15.00")
        );
        seedProfile(
            "sohrab",
            "Sohrab",
            "Demo",
            "sohrab@example.test",
            "+49 30 111111",
            "Unter den Linden 1",
            "Berlin",
            "10117",
            List.of("Korean", "Japanese"),
            List.of("Vegetarian", "Spicy"),
            List.of(),
            List.of("beef"),
            new BigDecimal("13.00")
        );
        seedProfile(
            "max",
            "Max",
            "Mustermann",
            "max@example.test",
            "+49 30 222222",
            "Alexanderplatz 1",
            "Berlin",
            "10178",
            List.of("Turkish"),
            List.of("Halal"),
            List.of(),
            List.of(),
            new BigDecimal("16.00")
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
        String postalCode,
        List<String> favoriteCuisines,
        List<String> dietaryPreferences,
        List<String> allergies,
        List<String> dislikedIngredients,
        BigDecimal maximumPrice
    ) {
        Profile profile = profileRepository.findByUsername(username).orElseGet(Profile::new);
        boolean isNew = profile.getUsername() == null;

        if (!isNew && !profile.getFavoriteCuisines().isEmpty()) {
            return;
        }

        if (isNew) {
            profile.setUsername(username);
            profile.setFirstName(firstName);
            profile.setLastName(lastName);
            profile.setEmail(email);
            profile.setPhoneNumber(phoneNumber);
            profile.setStreet(street);
            profile.setCity(city);
            profile.setPostalCode(postalCode);
        }
        profile.setFavoriteCuisines(favoriteCuisines);
        profile.setDietaryPreferences(dietaryPreferences);
        profile.setAllergies(allergies);
        profile.setDislikedIngredients(dislikedIngredients);
        profile.setMaximumPrice(maximumPrice);
        profileRepository.save(profile);
    }
}
