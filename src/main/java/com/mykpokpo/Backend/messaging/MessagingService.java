package com.mykpokpo.Backend.messaging;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.notification.NotificationService;
import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository        conversationRepository;
    private final ConversationMessageRepository messageRepository;
    private final GarageRepository              garageRepository;
    private final NotificationService           notificationService;

    // ── Conversations ─────────────────────────────────────────────────────────

    /** Liste toutes les conversations d'un garage (appelé par le garagiste). */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsByGarage(Long garageId, User user) {
        Garage garage = requireGarage(garageId);
        requireGarageOwner(garage, user);
        return conversationRepository.findAllByGarageOrderByLastModifiedDateDesc(garage)
                .stream()
                .map(c -> ConversationResponse.from(c, c.getUnreadByGarage()))
                .toList();
    }

    /** Liste toutes les conversations d'un client (appelé par le client). */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsByClient(User client) {
        return conversationRepository.findAllByClientOrderByLastModifiedDateDesc(client)
                .stream()
                .map(c -> ConversationResponse.from(c, c.getUnreadByClient()))
                .toList();
    }

    /**
     * Retrouve ou crée la conversation entre un client et un garage.
     * Appelé par le client depuis l'app mobile.
     */
    @Transactional
    public ConversationResponse getOrCreateConversation(Long garageId, User client) {
        Garage garage = requireGarage(garageId);
        Conversation conv = conversationRepository.findByGarageAndClient(garage, client)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder().garage(garage).client(client).build()
                ));
        return ConversationResponse.from(conv, conv.getUnreadByClient());
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /** Retourne tous les messages d'une conversation. */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long conversationId, User user) {
        Conversation conv = requireConversationAccess(conversationId, user);
        return messageRepository.findAllByConversationOrderByCreatedAtAsc(conv)
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    /** Envoie un message dans une conversation. */
    @Transactional
    public MessageResponse sendMessage(Long conversationId, MessageRequest request, User sender) {
        Conversation conv = requireConversationAccess(conversationId, sender);
        SenderRole role = detectRole(sender);

        ConversationMessage msg = ConversationMessage.builder()
                .conversation(conv)
                .sender(sender)
                .senderRole(role)
                .content(request.getContent())
                .build();
        messageRepository.save(msg);

        // Mise à jour du résumé de la conversation
        conv.setLastMessage(truncate(request.getContent(), 80));
        if (role == SenderRole.GARAGISTE) {
            conv.setUnreadByClient(conv.getUnreadByClient() + 1);
        } else {
            conv.setUnreadByGarage(conv.getUnreadByGarage() + 1);
        }
        conversationRepository.save(conv);

        // Notification push vers le destinataire
        User recipient = role == SenderRole.GARAGISTE
                ? conv.getClient()
                : conv.getGarage().getOwner();
        notificationService.push(
                recipient,
                "Nouveau message",
                sender.fullName() + " : " + truncate(request.getContent(), 60),
                "message"
        );

        return MessageResponse.from(msg);
    }

    /** Marque tous les messages reçus comme lus et remet le compteur à zéro. */
    @Transactional
    public void markRead(Long conversationId, User user) {
        Conversation conv = requireConversationAccess(conversationId, user);
        SenderRole role = detectRole(user);

        messageRepository.markReceivedMessagesAsRead(conv, role);

        if (role == SenderRole.GARAGISTE) {
            conv.setUnreadByGarage(0);
        } else {
            conv.setUnreadByClient(0);
        }
        conversationRepository.save(conv);
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private Garage requireGarage(Long garageId) {
        return garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Garage introuvable (id=" + garageId + ")"));
    }

    private void requireGarageOwner(Garage garage, User user) {
        if (!garage.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas propriétaire de ce garage");
        }
    }

    private Conversation requireConversationAccess(Long conversationId, User user) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Conversation introuvable (id=" + conversationId + ")"));
        SenderRole role = detectRole(user);
        boolean hasAccess = switch (role) {
            case GARAGISTE -> conv.getGarage().getOwner().getId().equals(user.getId());
            case CLIENT    -> conv.getClient().getId().equals(user.getId());
        };
        if (!hasAccess) {
            throw new AccessDeniedException("Accès à cette conversation refusé");
        }
        return conv;
    }

    private SenderRole detectRole(User user) {
        boolean isGaragiste = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("GARAGISTE"));
        return isGaragiste ? SenderRole.GARAGISTE : SenderRole.CLIENT;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return null;
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "…";
    }
}
