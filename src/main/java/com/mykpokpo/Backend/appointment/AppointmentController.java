package com.mykpokpo.Backend.appointment;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(
            @RequestBody @Valid AppointmentRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.create(request, user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AppointmentResponse>> findMyAppointments(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.findMyAppointments(user));
    }

    @GetMapping("/garage/{garageId}")
    public ResponseEntity<List<AppointmentResponse>> findByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.findByGarage(garageId, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.findById(id, user));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirm(
            @PathVariable Long id,
            @RequestBody AppointmentActionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.confirm(id, request, user));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<AppointmentResponse> reject(
            @PathVariable Long id,
            @RequestBody AppointmentActionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.reject(id, request, user));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable Long id,
            @RequestBody @Valid RescheduleRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.reschedule(id, request, user));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.cancel(id, user));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> complete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(appointmentService.complete(id, user));
    }
}
