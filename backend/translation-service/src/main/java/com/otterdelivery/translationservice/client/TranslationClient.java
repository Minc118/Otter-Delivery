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
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import java.util.List;


@Component
@Slf4j
public class TranslationClient {

    private final WebClient webClient;
    private final Cache translationCache;
    public TranslationClient(
            @Qualifier("deeplWebClient") WebClient webClient,
            CacheManager cacheManager
    ) {
        this.webClient = webClient;
        this.translationCache = cacheManager.getCache("translations");
    }
    private String buildKey(List<String> texts, String lang) {
        return lang + "::" + String.join("|", texts);
    }

    @Value("${deepl.api-key}")
    private String apiKey;

    @Value("${deepl.base-url}")
    private String baseUrl;

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

        String key = buildKey(texts, targetLang);

        Cache.ValueWrapper cached = translationCache != null ? translationCache.get(key) : null;

        if (cached != null) {
            log.info("🟢 CACHE HIT (batch) -> {}", key);
            return Mono.just((List<String>) cached.get());
        }

        log.info("🔵 CACHE MISS (batch) -> {}", key);

        BodyInserters.FormInserter<String> form =
                BodyInserters.fromFormData("target_lang", targetLang);

        for (String text : texts) {
            form = form.with("text", text);
        }

        return webClient.post()
                .uri("")
                .header("Authorization", "DeepL-Auth-Key " + apiKey)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .bodyToMono(TranslationResponse.class)
                .map(response -> {
                    if (response == null || response.translations() == null) {
                        return texts;
                    }

                    return response.translations()
                            .stream()
                            .map(TranslationResult::text)
                            .toList();
                })
                .doOnNext(result -> {
                    if (translationCache != null) {
                        translationCache.put(key, result);
                    }
                })
                .onErrorResume(e -> {
                    log.warn("Batch translation failed: {}", e.getMessage());
                    return Mono.just(texts);
                });
    }

    private static record TranslationRequest(String text, String target_lang) {}

    private static record TranslationResponse(List<TranslationResult> translations) {}

    private static record TranslationResult(String text) {}
}