package com.otterdelivery.translationservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;


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

    //@Cacheable(cacheNames = "translations", key = "#targetLang + '::' + #text")
    //@Cacheable(cacheNames = "translations", key = "#text + '::' + #targetLang")
    public Mono<String> translate(String text, String target_lang) {
        if (text == null || text.isBlank() || target_lang == null || target_lang.isBlank()) {
            return Mono.just(text);
        }

        return webClient.post()
                .uri("")//uri(baseUrl)
                .header("Authorization", "DeepL-Auth-Key " + apiKey)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(
                        BodyInserters
                                .fromFormData("text", text)
                                .with("target_lang", target_lang)
                )
                .retrieve()
                .bodyToMono(TranslationResponse.class)
                .map(response -> {
                    if (response != null
                            && response.translations() != null
                            && !response.translations().isEmpty()) {

                        return response.translations().get(0).text();
                    }

                    return text;
                })
                .onErrorResume(e -> {
                    log.warn("Translation failed for text '{}' to language {}: {}",
                            text, target_lang, e.getMessage());
                    return Mono.just(text); // fallback to original text on error
                });
    }

    private static record TranslationRequest(String text, String target_lang) {}

    private static record TranslationResponse(List<TranslationResult> translations) {}

    private static record TranslationResult(String text) {}
}