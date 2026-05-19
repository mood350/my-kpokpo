package com.mykpokpo.Backend.user;

import com.mykpokpo.Backend.garage.GarageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final GarageRepository garageRepository;
    private final UserRepository   userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal User user) {
        var garage = garageRepository.findByOwner(user);
        String garageName = garage.map(g -> g.getName()).orElse(null);
        Long   garageId   = garage.map(g -> g.getId()).orElse(null);

        return ResponseEntity.ok(UserProfileResponse.from(user, garageName, garageId));
    }

    /**
     * Enregistre / met à jour le push token Expo de l'utilisateur courant.
     * Body : { "token": "ExponentPushToken[xxx]" }   (`null` ou chaîne vide pour le retirer)
     */
    @PutMapping("/me/push-token")
    public ResponseEntity<Void> updatePushToken(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body
    ) {
        String token = body.get("token");
        user.setPushToken(token == null || token.isBlank() ? null : token.trim());
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}
