package com.mykpokpo.Backend.intervention;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interventions")
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionService interventionService;

    /** GARAGE_ADMIN — Créer une intervention (avec ou sans RDV) */
    @PostMapping
    public ResponseEntity<InterventionResponse> create(
            @RequestBody @Valid InterventionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interventionService.create(request, user));
    }

    /** GARAGE_ADMIN — Toutes les interventions du garage */
    @GetMapping("/garage/{garageId}")
    public ResponseEntity<List<InterventionResponse>> findByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.findByGarage(garageId, user));
    }

    /** CLIENT / GARAGE_ADMIN — Historique d'interventions d'un véhicule */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<InterventionResponse>> findByVehicle(
            @PathVariable Long vehicleId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.findByVehicle(vehicleId, user));
    }

    /** TECHNICIAN — Mes interventions assignées */
    @GetMapping("/my")
    public ResponseEntity<List<InterventionResponse>> findMyInterventions(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.findMyInterventions(user));
    }

    /** CLIENT / GARAGE_ADMIN — Détail d'une intervention */
    @GetMapping("/{id}")
    public ResponseEntity<InterventionResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.findById(id, user));
    }

    /** GARAGE_ADMIN — Modifier diagnostic, technicien, coût main-d'œuvre... */
    @PutMapping("/{id}")
    public ResponseEntity<InterventionResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid InterventionUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.update(id, request, user));
    }

    /** GARAGE_ADMIN / TECHNICIAN — Changer le statut */
    @PutMapping("/{id}/status")
    public ResponseEntity<InterventionResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid StatusUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.updateStatus(id, request, user));
    }

    /** GARAGE_ADMIN — Ajouter une pièce utilisée (déduit le stock automatiquement) */
    @PostMapping("/{id}/parts")
    public ResponseEntity<InterventionResponse> addPart(
            @PathVariable Long id,
            @RequestBody @Valid InterventionPartRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interventionService.addPart(id, request, user));
    }
}
