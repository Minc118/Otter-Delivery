package com.otterdelivery.translationservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

/**
 * Configuration for WebClient beans.
 */
@Configuration
@Slf4j
public class WebClientConfig {

    @Bean
    public WebClient restaurantWebClient(@Value("${restaurant-service.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.create(ConnectionProvider.newConnection())
                .responseTimeout(java.time.Duration.ofSeconds(10))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .doOnConnected(conn -> conn.addHandlerLast(
                        new io.netty.handler.timeout.ReadTimeoutHandler(10)
                ));

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    @Bean
    public WebClient deeplWebClient(@Value("${deepl.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.create(ConnectionProvider.newConnection())
                .responseTimeout(java.time.Duration.ofSeconds(10))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .doOnConnected(conn -> conn.addHandlerLast(
                        new io.netty.handler.timeout.ReadTimeoutHandler(10)
                ));

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}