package com.mykpokpo.Backend.notification;

import com.mykpokpo.Backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Authentifié — Mes notifications (les plus récentes en premier) */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> findMyNotifications(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(notificationService.findMyNotifications(user));
    }

    /** Authentifié — Nombre de notifications non lues */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> countUnread(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.countUnread(user)));
    }

    /** Authentifié — Marquer une notification comme lue */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, user));
    }

    /** Authentifié — Tout marquer comme lu */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal User user
    ) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.noContent().build();
    }
}
