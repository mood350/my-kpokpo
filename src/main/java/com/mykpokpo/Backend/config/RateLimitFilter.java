package com.mykpokpo.Backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting par IP avec Bucket4j (token bucket algorithm).
 *
 * Deux niveaux :
 *  - Endpoints auth sensibles (login, register, forgot-password, reset-password)
 *    → app.rate-limit.auth.capacity  requetes / minute  (protection brute-force)
 *  - Reste de l'API
 *    → app.rate-limit.api.capacity   requetes / minute
 *
 * Repond 429 Too Many Requests si le bucket est vide.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.auth.capacity:10}")
    private int authCapacity;

    @Value("${app.rate-limit.api.capacity:100}")
    private int apiCapacity;

    // Buckets separes par IP pour les endpoints sensibles et generaux
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets  = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String ip   = resolveClientIp(request);
        String path = request.getRequestURI();

        Bucket bucket = isSensitiveAuthPath(path)
                ? authBuckets.computeIfAbsent(ip, k -> buildAuthBucket())
                : apiBuckets.computeIfAbsent(ip, k -> buildApiBucket());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            sendRateLimitResponse(response, path);
        }
    }

    // ── Buckets ───────────────────────────────────────────────────────────────

    private Bucket buildAuthBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(authCapacity)
                        .refillGreedy(authCapacity, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket buildApiBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(apiCapacity)
                        .refillGreedy(apiCapacity, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isSensitiveAuthPath(String path) {
        return path.contains("/auth/login")
                || path.contains("/auth/register")
                || path.contains("/auth/forgot-password")
                || path.contains("/auth/reset-password");
    }

    /**
     * Resout l'IP reelle du client en tenant compte des proxies / load-balancers
     * (header X-Forwarded-For) — prend la premiere IP de la chaine.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response, String path) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.addHeader("Retry-After", "60");
        response.getWriter().write("""
                {
                  "code": "RATE_LIMIT_EXCEEDED",
                  "message": "Trop de requetes. Reessayez dans 1 minute.",
                  "path": "%s"
                }
                """.formatted(path));
    }
}
