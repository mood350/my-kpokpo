package com.mykpokpo.Backend.garage;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/garages")
@RequiredArgsConstructor
public class
GarageController {

    private final GarageService garageService;

    @PostMapping
    public ResponseEntity<GarageResponse> create(
            @RequestBody @Valid GarageRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(garageService.create(request, user));
    }

    /** Public — filtre optionnel : ?city=Lome */
    @GetMapping
    public ResponseEntity<List<GarageResponse>> findAll(
            @RequestParam(required = false) String city
    ) {
        return ResponseEntity.ok(garageService.findAll(city));
    }

    /** Public */
    @GetMapping("/{id}")
    public ResponseEntity<GarageResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(garageService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GarageResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid GarageRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(garageService.update(id, request, user));
    }

    @PostMapping("/{id}/working-hours")
    public ResponseEntity<List<WorkingHoursResponse>> setWorkingHours(
            @PathVariable Long id,
            @RequestBody @Valid List<WorkingHoursRequest> requests,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(garageService.setWorkingHours(id, requests, user));
    }

    /** Public */
    @GetMapping("/{id}/working-hours")
    public ResponseEntity<List<WorkingHoursResponse>> getWorkingHours(@PathVariable Long id) {
        return ResponseEntity.ok(garageService.getWorkingHours(id));
    }
}
