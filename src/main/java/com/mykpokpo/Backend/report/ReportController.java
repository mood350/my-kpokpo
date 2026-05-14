package com.mykpokpo.Backend.report;

import com.mykpokpo.Backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports/garage")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** GARAGE_ADMIN — KPIs du mois en cours */
    @GetMapping("/{garageId}/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(reportService.getDashboard(garageId, user));
    }

    /**
     * GARAGE_ADMIN — Chiffre d'affaires sur une période.
     * Paramètres : startDate et endDate (format ISO : yyyy-MM-dd).
     * Par défaut : mois en cours.
     */
    @GetMapping("/{garageId}/revenue")
    public ResponseEntity<RevenueResponse> getRevenue(
            @PathVariable Long garageId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal User user
    ) {
        YearMonth current = YearMonth.now();
        LocalDate start = startDate != null ? startDate : current.atDay(1);
        LocalDate end = endDate != null ? endDate : current.atEndOfMonth();
        return ResponseEntity.ok(reportService.getRevenue(garageId, user, start, end));
    }

    /**
     * GARAGE_ADMIN — Statistiques d'interventions sur une période.
     * Par défaut : mois en cours.
     */
    @GetMapping("/{garageId}/interventions")
    public ResponseEntity<InterventionStatsResponse> getInterventionStats(
            @PathVariable Long garageId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal User user
    ) {
        YearMonth current = YearMonth.now();
        LocalDate start = startDate != null ? startDate : current.atDay(1);
        LocalDate end = endDate != null ? endDate : current.atEndOfMonth();
        return ResponseEntity.ok(reportService.getInterventionStats(garageId, user, start, end));
    }

    /** GARAGE_ADMIN — Top 10 des services facturés (par fréquence) */
    @GetMapping("/{garageId}/top-services")
    public ResponseEntity<List<TopServiceResponse>> getTopServices(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(reportService.getTopServices(garageId, user));
    }

    /** GARAGE_ADMIN — Véhicules clients avec assurance ou CT expirant dans 30 jours */
    @GetMapping("/{garageId}/upcoming-maintenance")
    public ResponseEntity<List<UpcomingMaintenanceResponse>> getUpcomingMaintenance(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(reportService.getUpcomingMaintenance(garageId, user));
    }
}
