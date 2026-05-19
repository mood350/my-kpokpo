package com.mykpokpo.Backend.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminStatsService.getStats());
    }

    @GetMapping("/garages")
    public ResponseEntity<List<AdminGarageResponse>> getGarages() {
        return ResponseEntity.ok(adminStatsService.getAllGarages());
    }

    @PatchMapping("/garages/{id}/verify")
    public ResponseEntity<AdminGarageResponse> toggleVerify(@PathVariable Long id) {
        return ResponseEntity.ok(adminStatsService.toggleVerify(id));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers() {
        return ResponseEntity.ok(adminStatsService.getAllUsers());
    }
}
