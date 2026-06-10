package com.otterdelivery.translationservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;


@Component
@Slf4j
public class TranslationClient {

    private final WebClient webClient;

    public TranslationClient(@Qualifier("deeplWebClient") WebClient webClient){
        this.webClient=webClient;
    }

    @Value("${deepl.api-key}")
    private String apiKey;

    @Value("${deepl.base-url}")
    private String baseUrl;


    public Mono<String> translate(String text, String targetLang) {
        if (text == null || text.isBlank() || targetLang == null || targetLang.isBlank()) {
            return Mono.just(text);
        }

        return webClient.post()
                .uri(baseUrl)
                .header("Authorization", "DeepL-Auth-Key " + apiKey)
                .bodyValue(new TranslationRequest(text, targetLang))
                .retrieve()
                .bodyToMono(TranslationResponse.class)
                .map(response -> {
                    if (response != null
                            && response.translations() != null
                            && response.translations().length > 0) {

                        return response.translations()[0].text();
                    }

                    return text;
                })
                .onErrorResume(e -> {
                    log.warn("Translation failed for text '{}' to language {}: {}",
                            text, targetLang, e.getMessage());
                    return Mono.just(text); // fallback to original text on error
                });
    }

    private static record TranslationRequest(String text, String targetLang) {}

    private static record TranslationResponse(TranslationResult[] translations) {}

    private static record TranslationResult(String text) {}
}