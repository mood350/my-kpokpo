package com.mykpokpo.Backend.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findAllByConversationOrderByCreatedAtAsc(Conversation conversation);

    @Modifying
    @Query("UPDATE ConversationMessage m SET m.read = true " +
           "WHERE m.conversation = :conv AND m.senderRole != :role AND m.read = false")
    void markReceivedMessagesAsRead(@Param("conv") Conversation conv, @Param("role") SenderRole role);
}
