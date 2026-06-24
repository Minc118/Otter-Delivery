package com.otterdelivery.profileservice.repository;

import com.otterdelivery.profileservice.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}