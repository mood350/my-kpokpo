package com.mykpokpo.Backend.vehicle;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<VehicleResponse> create(
            @RequestBody @Valid VehicleRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.create(request, user));
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> findAll(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(vehicleService.findAllByOwner(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(vehicleService.findById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid VehicleRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(vehicleService.update(id, request, user));
    }

    @PutMapping("/{id}/mileage")
    public ResponseEntity<VehicleResponse> updateMileage(
            @PathVariable Long id,
            @RequestBody @Valid MileageUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(vehicleService.updateMileage(id, request.getCurrentMileage(), user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        vehicleService.delete(id, user);
    }
}
