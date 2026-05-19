package com.mykpokpo.Backend.messaging;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    // ── Conversations ─────────────────────────────────────────────────────────

    /** Garagiste : liste toutes ses conversations. */
    @GetMapping("/garage/{garageId}/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversationsByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(messagingService.getConversationsByGarage(garageId, user));
    }

    /** Client : liste toutes ses conversations. */
    @GetMapping("/my/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(messagingService.getConversationsByClient(user));
    }

    /** Client : retrouve ou crée une conversation avec un garage. */
    @PostMapping("/garage/{garageId}/conversations")
    public ResponseEntity<ConversationResponse> getOrCreateConversation(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(messagingService.getOrCreateConversation(garageId, user));
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /** Récupère tous les messages d'une conversation. */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(messagingService.getMessages(conversationId, user));
    }

    /** Envoie un message dans une conversation. */
    @PostMapping("/conversations/{conversationId}/send")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody @Valid MessageRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.sendMessage(conversationId, request, user));
    }

    /** Marque les messages reçus comme lus (remet le compteur non-lu à zéro). */
    @PatchMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal User user
    ) {
        messagingService.markRead(conversationId, user);
        return ResponseEntity.noContent().build();
    }
}
