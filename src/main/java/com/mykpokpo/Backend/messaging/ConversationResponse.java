package com.mykpokpo.Backend.messaging;

import java.time.LocalDateTime;

public record ConversationResponse(
        Long           id,
        Long           garageId,
        String         garageName,
        Long           clientId,
        String         clientFirstName,
        String         clientLastName,
        String         clientEmail,
        String         lastMessage,
        int            unreadCount,
        LocalDateTime  updatedAt
) {
    public static ConversationResponse from(Conversation c, int unreadCount) {
        return new ConversationResponse(
                c.getId(),
                c.getGarage().getId(),
                c.getGarage().getName(),
                c.getClient().getId(),
                c.getClient().getFirstName(),
                c.getClient().getLastName(),
                c.getClient().getEmail(),
                c.getLastMessage(),
                unreadCount,
                c.getLastModifiedDate() != null ? c.getLastModifiedDate() : c.getCreatedAt()
        );
    }
}
