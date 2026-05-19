package com.mykpokpo.Backend.dashboard;

import com.mykpokpo.Backend.appointment.AppointmentRepository;
import com.mykpokpo.Backend.appointment.AppointmentResponse;
import com.mykpokpo.Backend.appointment.AppointmentStatus;
import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.intervention.InterventionRepository;
import com.mykpokpo.Backend.intervention.InterventionResponse;
import com.mykpokpo.Backend.invoice.InvoiceRepository;
import com.mykpokpo.Backend.parts.SparePartRepository;
import com.mykpokpo.Backend.parts.SparePartResponse;
import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final GarageRepository         garageRepository;
    private final InterventionRepository    interventionRepository;
    private final InvoiceRepository         invoiceRepository;
    private final AppointmentRepository     appointmentRepository;
    private final SparePartRepository       sparePartRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(User user) {
        Garage garage = garageRepository.findByOwner(user)
                .orElseThrow(() -> new EntityNotFoundException("Vous ne possédez pas de garage enregistré"));

        LocalDate today         = LocalDate.now();
        LocalDate firstOfMonth  = today.withDayOfMonth(1);
        LocalDate lastOfMonth   = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate firstLastMonth = firstOfMonth.minusMonths(1);
        LocalDate lastLastMonth  = firstOfMonth.minusDays(1);

        // ── KPIs ──────────────────────────────────────────────────────────────
        long intThisMonth = interventionRepository.countByGarageAndInterventionDateBetween(
                garage, firstOfMonth, lastOfMonth);
        long intLastMonth = interventionRepository.countByGarageAndInterventionDateBetween(
                garage, firstLastMonth, lastLastMonth);

        BigDecimal revThisMonth = invoiceRepository.sumRevenueTTCByPeriod(garage, firstOfMonth, lastOfMonth);
        BigDecimal revLastMonth = invoiceRepository.sumRevenueTTCByPeriod(garage, firstLastMonth, lastLastMonth);

        long pendingAppointments = appointmentRepository.countByGarageAndStatus(garage, AppointmentStatus.PENDING);
        long stockAlerts         = sparePartRepository.findLowStockByGarage(garage).size();

        DashboardResponse.KpiSummary kpi = new DashboardResponse.KpiSummary(
                intThisMonth,
                trend(intThisMonth, intLastMonth),
                revThisMonth,
                trend(revThisMonth.longValue(), revLastMonth.longValue()),
                pendingAppointments,
                stockAlerts
        );

        // ── Graphique CA — 12 derniers mois ───────────────────────────────────
        List<DashboardResponse.RevenuePoint> chart = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate monthStart = today.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd   = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            BigDecimal total     = invoiceRepository.sumRevenueTTCByPeriod(garage, monthStart, monthEnd);
            String label = monthStart.getMonth()
                    .getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                    .substring(0, 3)
                    .toLowerCase();
            // Capitaliser la première lettre (ex: "Jan")
            label = Character.toUpperCase(label.charAt(0)) + label.substring(1);
            chart.add(new DashboardResponse.RevenuePoint(label, total));
        }

        // ── 5 dernières interventions ─────────────────────────────────────────
        List<InterventionResponse> recentInterventions = interventionRepository
                .findTop5ByGarageOrderByInterventionDateDesc(garage)
                .stream()
                .map(InterventionResponse::from)
                .toList();

        // ── RDV du jour ───────────────────────────────────────────────────────
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay   = today.atTime(23, 59, 59);
        List<AppointmentResponse> todayAppointments = appointmentRepository
                .findAllByGarageAndRequestedDateBetweenOrderByRequestedDateAsc(garage, startOfDay, endOfDay)
                .stream()
                .map(AppointmentResponse::from)
                .toList();

        // ── Stock critique ────────────────────────────────────────────────────
        List<SparePartResponse> criticalStock = sparePartRepository
                .findLowStockByGarage(garage)
                .stream()
                .map(SparePartResponse::from)
                .toList();

        return new DashboardResponse(kpi, chart, recentInterventions, todayAppointments, criticalStock);
    }

    private Integer trend(long current, long previous) {
        if (previous == 0) return null;
        return (int) Math.round((double) (current - previous) / previous * 100);
    }
}
