package com.mykpokpo.Backend.technician;

import com.mykpokpo.Backend.intervention.InterventionResponse;
import com.mykpokpo.Backend.intervention.InterventionService;
import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;
    private final InterventionService interventionService;

    /** GARAGE_ADMIN — Ajouter un technicien à son garage */
    @PostMapping
    public ResponseEntity<TechnicianResponse> addTechnician(
            @RequestBody @Valid TechnicianRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(technicianService.addTechnician(request, user));
    }

    /** GARAGE_ADMIN — Lister les techniciens d'un garage */
    @GetMapping("/garage/{garageId}")
    public ResponseEntity<List<TechnicianResponse>> findByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(technicianService.findByGarage(garageId, user));
    }

    /** GARAGE_ADMIN — Modifier la spécialité ou la disponibilité d'un technicien */
    @PutMapping("/{id}")
    public ResponseEntity<TechnicianResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid TechnicianUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(technicianService.update(id, request, user));
    }

    /** GARAGE_ADMIN — Retirer un technicien du garage */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        technicianService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /** TECHNICIAN — Interventions assignées au technicien authentifié */
    @GetMapping("/{id}/interventions")
    public ResponseEntity<List<InterventionResponse>> getInterventions(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(interventionService.findMyInterventions(user));
    }
}
