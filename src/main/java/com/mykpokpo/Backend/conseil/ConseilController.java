package com.mykpokpo.Backend.conseil;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conseils")
@RequiredArgsConstructor
public class ConseilController {

    private final ConseilService conseilService;

    /** Tous les conseils publiés (clients, garagistes, admins). */
    @GetMapping
    public ResponseEntity<List<ConseilResponse>> findAll() {
        return ResponseEntity.ok(conseilService.findAll());
    }

    /** Mes conseils (garagiste ou admin connecté). */
    @GetMapping("/mine")
    public ResponseEntity<List<ConseilResponse>> findMine(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(conseilService.findMine(user));
    }

    /** Créer un conseil (admin ou garagiste). */
    @PostMapping
    public ResponseEntity<ConseilResponse> create(
            @RequestBody @Valid ConseilRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conseilService.create(request, user));
    }

    /** Supprimer un conseil (auteur ou admin). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        conseilService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
