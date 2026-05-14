package com.mykpokpo.Backend.auth;

import com.mykpokpo.Backend.email.EmailService;
import com.mykpokpo.Backend.email.EmailTemplateName;
import com.mykpokpo.Backend.role.RoleRepository;
import com.mykpokpo.Backend.security.JwtService;
import com.mykpokpo.Backend.token.Token;
import com.mykpokpo.Backend.token.TokenRepository;
import com.mykpokpo.Backend.token.TokenType;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.user.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${application.mail.from}")
    private String from;

    @Value("${application.mailing.frontend.activation-url}")
    private String activationUrl;

    // ═══════════════════════════════════════════════════════════════
    //  INSCRIPTION
    // ═══════════════════════════════════════════════════════════════

    public void register(RegistrationRequest request) throws MessagingException {
        var userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new RuntimeException("Rôle USER introuvable en BDD"));

        var user = User.builder()
                .firstName(request.getFirstname())
                .lastName(request.getLastname())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(List.of(userRole))
                .enabled(false)
                .accountLocked(false)
                .build();

        userRepository.save(user);
        sendConfirmationEmail(user);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONFIRMATION EMAIL
    // ═══════════════════════════════════════════════════════════════

    private void sendConfirmationEmail(User user) throws MessagingException {
        Token token = generateAndSaveToken(user, TokenType.ACTIVATION);

        // Lien cliquable avec UUID — ex: http://localhost:4200/activate?token=a3f2c1d4-...
        String activationLink = activationUrl + "?token=" + token.getLinkToken();

        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("confirmationUrl", activationLink);   // lien cliquable (desktop)
        properties.put("activation_code", token.getToken()); // code OTP (mobile)

        emailService.sendEmail(
                user.getEmail(),
                "Confirmation de votre compte",
                EmailTemplateName.ACTIVATE_ACCOUNT,
                properties,
                from
        );
    }

    /**
     * Valide le compte via code OTP (mobile) ou lien UUID (desktop).
     * Le token reçu peut être :
     *  - un code 6 chiffres  → vérifié via Token.token
     *  - un UUID (lien email) → vérifié via Token.linkToken
     */
    @Transactional
    public void confirmAccount(String tokenValue) throws MessagingException {
        Token token = tokenRepository.findByLinkToken(tokenValue)
                .or(() -> tokenRepository.findByToken(tokenValue))
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (token.getValidatedAt() != null) {
            throw new IllegalArgumentException("Ce token a déjà été utilisé");
        }

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            sendConfirmationEmail(token.getUser());
            throw new IllegalArgumentException("Token expiré. Un nouveau lien vous a été envoyé.");
        }

        User user = token.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        token.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        sendWelcomeEmail(user);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONNEXION
    // ═══════════════════════════════════════════════════════════════

    public AuthenticationResponse authenticate(
            AuthenticationRequest request,
            String ipAddress,
            String userAgent
    ) throws MessagingException {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (isNewDevice(user, ipAddress, userAgent)) {
            sendNewDeviceEmail(user, ipAddress, userAgent);
        }

        user.setLastKnownIp(ipAddress);
        user.setLastKnownUserAgent(userAgent);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    //  RESET PASSWORD
    // ═══════════════════════════════════════════════════════════════

    public void requestPasswordReset(String email) throws MessagingException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email introuvable"));

        Token token = generateAndSaveToken(user, TokenType.PASSWORD_RESET);

        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("reset_code", token.getToken());

        emailService.sendEmail(
                user.getEmail(),
                "Réinitialisation de votre mot de passe",
                EmailTemplateName.RESET_PASSWORD,
                properties,
                from
        );
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        Token token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (token.getValidatedAt() != null) {
            throw new IllegalArgumentException("Ce token a déjà été utilisé");
        }

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            throw new IllegalArgumentException("Token expiré");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    // ═══════════════════════════════════════════════════════════════
    //  REFRESH TOKEN
    // ═══════════════════════════════════════════════════════════════

    public AuthenticationResponse refreshToken(String refreshToken) {
        final String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail == null) throw new RuntimeException("Refresh token invalide");

        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new RuntimeException("Refresh token expiré ou invalide");
        }

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .refreshToken(refreshToken)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    //  LOGOUT
    // ═══════════════════════════════════════════════════════════════

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return;
        SecurityContextHolder.clearContext();
    }

    // ═══════════════════════════════════════════════════════════════
    //  UTILITAIRES PRIVÉS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Génère un OTP 6 chiffres + un UUID pour le lien cliquable.
     * Expire dans 15 minutes.
     */
    private Token generateAndSaveToken(User user, TokenType type) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        String linkToken = UUID.randomUUID().toString();

        Token token = Token.builder()
                .token(otp)
                .linkToken(linkToken)
                .tokenType(type)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .user(user)
                .build();

        return tokenRepository.save(token);
    }

    private boolean isNewDevice(User user, String ipAddress, String userAgent) {
        if (user.getLastKnownIp() == null) return false;
        return !user.getLastKnownIp().equals(ipAddress) ||
                !user.getLastKnownUserAgent().equals(userAgent);
    }

    private void sendWelcomeEmail(User user) throws MessagingException {
        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());

        emailService.sendEmail(
                user.getEmail(),
                "Bienvenue !",
                EmailTemplateName.WELCOME,
                properties,
                from
        );
    }

    private void sendNewDeviceEmail(User user, String ip, String userAgent) throws MessagingException {
        Map<String, Object> properties = new HashMap<>();
        properties.put("username", user.fullName());
        properties.put("ip", ip);
        properties.put("device", userAgent);
        properties.put("time", LocalDateTime.now().toString());

        emailService.sendEmail(
                user.getEmail(),
                "Nouvelle connexion détectée sur votre compte",
                EmailTemplateName.NEW_DEVICE_LOGIN,
                properties,
                from
        );
    }
}
