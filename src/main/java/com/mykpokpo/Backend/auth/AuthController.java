package com.mykpokpo.Backend.auth;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void register(@RequestBody @Valid RegistrationRequest request)
            throws MessagingException {
        authService.register(request);
    }

    /**
     * Accepte le code OTP (mobile) ou l'UUID du lien (desktop).
     * GET /api/auth/confirm?token=123456
     * GET /api/auth/confirm?token=a3f2c1d4-...
     */
    @GetMapping("/confirm")
    public ResponseEntity<String> confirmAccount(@RequestParam String token)
            throws MessagingException {
        authService.confirmAccount(token);
        return ResponseEntity.ok("Compte activé avec succès !");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @RequestBody @Valid AuthenticationRequest request,
            HttpServletRequest httpRequest
    ) throws MessagingException {
        String ip = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        return ResponseEntity.ok(authService.authenticate(request, ip, userAgent));
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@RequestParam String email) throws MessagingException {
        authService.requestPasswordReset(email);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword
    ) {
        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Mot de passe réinitialisé avec succès !");
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthenticationResponse> refreshToken(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.refreshToken(authHeader.substring(7)));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
    }
}
