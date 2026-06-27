package com.otterdelivery.profileservice.repository;

import com.otterdelivery.profileservice.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;


public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUsername(String username);
}