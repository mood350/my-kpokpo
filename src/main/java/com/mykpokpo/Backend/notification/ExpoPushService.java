package com.mykpokpo.Backend.notification;

import com.mykpokpo.Backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Envoi de notifications push via l'API Expo (gratuit, no-auth).
 *
 * Doc : https://docs.expo.dev/push-notifications/sending-notifications/
 *   POST https://exp.host/--/api/v2/push/send
 *   Body : { to, title, body, data, sound }
 *
 * Les erreurs (token invalide, device unregistered, etc.) sont loggées mais
 * n'interrompent jamais le flux applicatif.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();

    @Async
    public void send(User user, String title, String body, Map<String, Object> data) {
        String token = user.getPushToken();
        if (token == null || token.isBlank()) {
            return; // utilisateur sans appareil enregistré → silencieux
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("to",    token);
        payload.put("title", title);
        payload.put("body",  body);
        payload.put("sound", "default");
        if (data != null && !data.isEmpty()) {
            payload.put("data", data);
        }

        try {
            String response = restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            log.debug("Expo push envoyé à user={} : {}", user.getId(), response);
        } catch (Exception e) {
            log.warn("Échec d'envoi push Expo pour user={} : {}", user.getId(), e.getMessage());
        }
    }
}
