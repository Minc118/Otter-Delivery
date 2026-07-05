package com.otterdelivery.translationservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest
@AutoConfigureWebTestClient
class TranslationServiceApplicationTests {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointReturnsHealthyStatus() {
        webTestClient.get()
                .uri("/api/translations/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Translation service is healthy");
    }
}
