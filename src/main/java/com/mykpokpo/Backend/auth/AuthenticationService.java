package com.mykpokpo.Backend.auth;

import com.mykpokpo.Backend.email.EmailService;
import com.mykpokpo.Backend.email.EmailTemplateName;
import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
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
    private final GarageRepository garageRepository;
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

    @Transactional
    public void register(RegistrationRequest request) throws MessagingException {
        var existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.isEnabled()) {
                throw new IllegalArgumentException("Un compte actif existe déjà avec cet email");
            }
            // Compte non activé : on ne tolère le renvoi de code QUE si le rôle demandé
            // est le même. Tout changement de rôle/nom/password sur un compte existant
            // doit être un échec explicite — sinon n'importe qui connaissant l'email d'un
            // user non confirmé pourrait écraser ses tokens d'activation.
            boolean sameRole = user.getRoles().stream()
                    .anyMatch(r -> r.getRoleName().equalsIgnoreCase(request.getRole()));
            if (!sameRole) {
                throw new IllegalArgumentException(
                        "Un compte non activé existe déjà avec cet email pour un autre type d'utilisateur. " +
                        "Confirmez-le ou utilisez un autre email.");
            }
            // Même rôle, compte toujours en attente : renouveler le code d'activation
            tokenRepository.deleteAllByUserAndTokenType(user, TokenType.ACTIVATION);
            sendConfirmationEmail(user);
            return;
        }

        if ("GARAGISTE".equals(request.getRole()) && request.getGarage() == null) {
            throw new IllegalArgumentException(
                    "Les informations du garage sont obligatoires pour l'inscription en tant que professionnel");
        }

        var userRole = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Rôle introuvable en BDD : " + request.getRole()));

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

        if ("GARAGISTE".equals(request.getRole())) {
            RegistrationRequest.GarageInfo g = request.getGarage();
            Garage garage = Garage.builder()
                    .owner(user)
                    .name(g.getName())
                    .city(g.getCity())
                    .address(g.getAddress())
                    .phone(g.getPhone())
                    .email(g.getEmail())
                    .country(g.getCountry() != null ? g.getCountry() : "Togo")
                    .description(g.getDescription())
                    .verified(false)
                    .build();
            garageRepository.save(garage);
        }

        sendConfirmationEmail(user);
    }

    @Transactional
    public void resendConfirmation(String email) throws MessagingException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Aucun compte trouvé avec cet email"));

        if (user.isEnabled()) {
            throw new IllegalArgumentException("Ce compte est déjà activé");
        }

        tokenRepository.deleteAllByUserAndTokenType(user, TokenType.ACTIVATION);
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
    // dontRollbackOn : si le token est expiré, on sauvegarde le nouveau token AVANT de lancer l'exception
    @Transactional(dontRollbackOn = IllegalArgumentException.class)
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
