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
        log.info("Translating [{}] -> [{}]", text, target_lang);
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
    public Mono<List<String>> translateBatch(List<String> texts, String targetLang) {

        if (texts == null || texts.isEmpty() || targetLang == null || targetLang.isBlank()) {
            return Mono.just(List.of());
        }

        log.info("Batch translating {} texts -> [{}]", texts.size(), targetLang);

        BodyInserters.FormInserter<String> form = BodyInserters.fromFormData("target_lang", targetLang);

        for (String text : texts) {
            form = form.with("text", text);
        }

        return webClient.post()
                .uri("") // or baseUrl if configured properly in WebClient bean
                .header("Authorization", "DeepL-Auth-Key " + apiKey)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .bodyToMono(TranslationResponse.class)
                .map(response -> {
                    if (response == null || response.translations() == null) {
                        return texts; // fallback: return original order
                    }

                    return response.translations()
                            .stream()
                            .map(TranslationResult::text)
                            .toList();
                })
                .onErrorResume(e -> {
                    log.warn("Batch translation failed for {} texts to {}: {}",
                            texts.size(), targetLang, e.getMessage());

                    return Mono.just(texts); // fallback
                });
    }

    private static record TranslationRequest(String text, String target_lang) {}

    private static record TranslationResponse(List<TranslationResult> translations) {}

    private static record TranslationResult(String text) {}
}