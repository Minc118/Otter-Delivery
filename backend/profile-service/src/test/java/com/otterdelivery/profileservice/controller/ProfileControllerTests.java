package com.otterdelivery.profileservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otterdelivery.profileservice.model.Profile;
import com.otterdelivery.profileservice.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:profile-controller-tests;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "order.service.url=http://localhost:8082"
})
@AutoConfigureMockMvc
class ProfileControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        profileRepository.deleteAll();
    }

    @Test
    void canCreateGetUpdateDeleteAndLoginProfile() throws Exception {
        Profile profile = new Profile();
        profile.setFirstName("John");
        profile.setLastName("Doe");
        profile.setUsername("johndoe");
        profile.setEmail("john@example.com");

        // Create Profile
        String responseContent = mockMvc.perform(post("/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profile)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andReturn().getResponse().getContentAsString();

        Profile created = objectMapper.readValue(responseContent, Profile.class);
        Long profileId = created.getId();

        // Get single profile
        mockMvc.perform(get("/profiles/" + profileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(profileId))
                .andExpect(jsonPath("$.username").value("johndoe"));

        // Login by username
        mockMvc.perform(get("/profiles/login/johndoe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(profileId));

        // Get all profiles
        mockMvc.perform(get("/profiles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Get orders for profile (should gracefully return empty list)
        mockMvc.perform(get("/profiles/" + profileId + "/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        // Update profile
        profile.setFirstName("Johnny");
        mockMvc.perform(put("/profiles/" + profileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profile)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Johnny"));

        // Delete profile
        mockMvc.perform(delete("/profiles/" + profileId))
                .andExpect(status().isOk());

        // Verify deleted
        mockMvc.perform(get("/profiles/" + profileId))
                .andExpect(status().isNotFound());
    }
}
