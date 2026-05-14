package com.mykpokpo.Backend.notification;

import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // ── API endpoints ─────────────────────────────────────────────────────────

    public List<NotificationResponse> findMyNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream().map(NotificationResponse::from).toList();
    }

    public long countUnread(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findByIdAndRecipient(id, user)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Notification introuvable (id=" + id + ")"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user, LocalDateTime.now());
    }

    // ── Méthodes internes appelées par les autres services ────────────────────

    public void push(User recipient, String title, String message, String channel) {
        Notification n = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .channel(channel)
                .build();
        notificationRepository.save(n);
    }

    /**
     * Variante avec referenceId — utilisée par le scheduler pour éviter
     * les doublons : ne crée pas si une notification identique existe déjà
     * dans la fenêtre de temps fournie.
     */
    public void pushIfNotSentSince(User recipient, String title, String message,
                                   String channel, Long referenceId, LocalDateTime notBefore) {
        boolean alreadySent = notificationRepository
                .existsByRecipientAndChannelAndReferenceIdAndCreatedAtAfter(
                        recipient, channel, referenceId, notBefore);
        if (!alreadySent) {
            Notification n = Notification.builder()
                    .recipient(recipient)
                    .title(title)
                    .message(message)
                    .channel(channel)
                    .referenceId(referenceId)
                    .build();
            notificationRepository.save(n);
        }
    }
}
