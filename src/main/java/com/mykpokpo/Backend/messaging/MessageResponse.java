package com.mykpokpo.Backend.messaging;

import java.time.LocalDateTime;

public record MessageResponse(
        Long          id,
        Long          conversationId,
        Long          senderId,
        String        senderRole,
        String        content,
        boolean       read,
        LocalDateTime createdAt
) {
    public static MessageResponse from(ConversationMessage m) {
        return new MessageResponse(
                m.getId(),
                m.getConversation().getId(),
                m.getSender().getId(),
                m.getSenderRole().name(),
                m.getContent(),
                m.isRead(),
                m.getCreatedAt()
        );
    }
}
