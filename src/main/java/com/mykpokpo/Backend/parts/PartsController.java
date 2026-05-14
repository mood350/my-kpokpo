package com.mykpokpo.Backend.parts;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parts")
@RequiredArgsConstructor
public class PartsController {

    private final PartsService partsService;

    /** GARAGE_ADMIN — Ajouter une pièce au catalogue du garage */
    @PostMapping
    public ResponseEntity<SparePartResponse> createPart(
            @RequestBody @Valid SparePartRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partsService.createPart(request, user));
    }

    /** GARAGE_ADMIN — Lister toutes les pièces du stock */
    @GetMapping("/garage/{garageId}")
    public ResponseEntity<List<SparePartResponse>> findByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(partsService.findByGarage(garageId, user));
    }

    /** GARAGE_ADMIN — Pièces dont le stock est sous le seuil d'alerte */
    @GetMapping("/garage/{garageId}/low-stock")
    public ResponseEntity<List<SparePartResponse>> findLowStock(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(partsService.findLowStock(garageId, user));
    }

    /** GARAGE_ADMIN — Modifier les informations d'une pièce (pas le stock) */
    @PutMapping("/{id}")
    public ResponseEntity<SparePartResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid SparePartRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(partsService.update(id, request, user));
    }

    /** GARAGE_ADMIN — Enregistrer un mouvement de stock (entrée/sortie/ajustement) */
    @PostMapping("/{id}/movements")
    public ResponseEntity<StockMovementResponse> addMovement(
            @PathVariable Long id,
            @RequestBody @Valid StockMovementRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partsService.addMovement(id, request, user));
    }

    /** GARAGE_ADMIN — Historique des mouvements d'une pièce */
    @GetMapping("/{id}/movements")
    public ResponseEntity<List<StockMovementResponse>> getMovements(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(partsService.getMovements(id, user));
    }
}
