package com.mykpokpo.Backend.config;

import com.mykpokpo.Backend.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Auth publique
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Swagger
                        .requestMatchers(
                                "/v2/api-docs", "/v3/api-docs", "/v3/api-docs/**",
                                "/swagger-resources", "/swagger-resources/**",
                                "/configuration/ui", "/configuration/security",
                                "/swagger-ui/**", "/webjars/**", "/swagger-ui.html"
                        ).permitAll()
                        // Lecture publique des garages
                        .requestMatchers(HttpMethod.GET, "/api/v1/garages", "/api/v1/garages/**").permitAll()
                        // Admin uniquement
                        .requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN")
                        // Dashboard : garagiste uniquement
                        .requestMatchers("/api/v1/dashboard").hasAuthority("GARAGISTE")
                        // Garagiste : gestion du garage, techniciens, pièces, interventions, factures
                        .requestMatchers(
                                "/api/v1/garages/my-garage",
                                "/api/v1/garages/*/working-hours",
                                "/api/v1/technicians/**",
                                "/api/v1/parts/**",
                                "/api/v1/interventions/**",
                                "/api/v1/invoices/**"
                        ).hasAuthority("GARAGISTE")
                        // Profil utilisateur connecté
                        .requestMatchers("/api/v1/users/me").authenticated()
                        // Véhicules : client (ses propres véhicules) et garagiste (consultation)
                        .requestMatchers("/api/v1/vehicles/**").hasAnyAuthority("CLIENT", "GARAGISTE")
                        // Rendez-vous : client et garagiste (lecture/actions différentes gérées dans le service)
                        .requestMatchers("/api/v1/appointments/**").hasAnyAuthority("CLIENT", "GARAGISTE")
                        // Messagerie : garagiste et client
                        .requestMatchers("/api/v1/messages/**").hasAnyAuthority("GARAGISTE", "CLIENT")
                        // Conseils : lecture pour tous, écriture pour garagiste et admin
                        .requestMatchers(HttpMethod.GET, "/api/v1/conseils", "/api/v1/conseils/**").authenticated()
                        .requestMatchers("/api/v1/conseils/**").hasAnyAuthority("ADMIN", "GARAGISTE")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "http://localhost:3000",
                "http://localhost:8000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
