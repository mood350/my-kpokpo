package com.mykpokpo.Backend.notification;

import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndIsReadFalse(User recipient);

    Optional<Notification> findByIdAndRecipient(Long id, User recipient);

    boolean existsByRecipientAndChannelAndReferenceIdAndCreatedAtAfter(
            User recipient, String channel, Long referenceId, LocalDateTime after);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.recipient = :recipient AND n.isRead = false")
    void markAllAsRead(@Param("recipient") User recipient, @Param("now") LocalDateTime now);
}
