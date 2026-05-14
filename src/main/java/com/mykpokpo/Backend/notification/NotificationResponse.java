package com.mykpokpo.Backend.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        boolean isRead,
        String channel,
        Long referenceId,
        LocalDateTime sentAt,
        LocalDateTime readAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getChannel(),
                n.getReferenceId(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }
}
