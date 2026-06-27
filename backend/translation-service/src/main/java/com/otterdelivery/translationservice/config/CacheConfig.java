package com.otterdelivery.translationservice.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;


@Configuration
public class CacheConfig {

    @Value("${cache.caffeine.spec}")
    private String cacheSpec;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("translations");
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    @Bean
    public Caffeine<Object, Object> caffeineCacheBuilder() {
        // Parse the cache spec from application.properties
        // Format: maximumSize=500,expireAfterAccess=10m
        Caffeine<Object, Object> caffeine = Caffeine.newBuilder();

        if (cacheSpec != null && !cacheSpec.isEmpty()) {
            String[] parts = cacheSpec.split(",");
            for (String part : parts) {
                String[] keyValue = part.split("=");
                if (keyValue.length == 2) {
                    String key = keyValue[0].trim();
                    String value = keyValue[1].trim();

                    switch (key) {
                        case "maximumSize":
                            caffeine.maximumSize(Long.parseLong(value));
                            break;
                        case "expireAfterAccess":
                            caffeine.expireAfterAccess(Duration.parse("PT" + value.toUpperCase()));
                            break;
                        case "expireAfterWrite":
                            caffeine.expireAfterWrite(Duration.parse("PT" + value.toUpperCase()));
                            break;
                    }
                }
            }
        }
        return caffeine;
    }
}