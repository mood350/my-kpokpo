package com.mykpokpo.Backend.report;

import com.mykpokpo.Backend.appointment.AppointmentRepository;
import com.mykpokpo.Backend.appointment.AppointmentStatus;
import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.intervention.InterventionRepository;
import com.mykpokpo.Backend.intervention.InterventionStatus;
import com.mykpokpo.Backend.invoice.InvoiceRepository;
import com.mykpokpo.Backend.invoice.InvoiceStatus;
import com.mykpokpo.Backend.parts.SparePartRepository;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.vehicle.Vehicle;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final GarageRepository garageRepository;
    private final AppointmentRepository appointmentRepository;
    private final InterventionRepository interventionRepository;
    private final InvoiceRepository invoiceRepository;
    private final SparePartRepository sparePartRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long garageId, User garageAdmin) {
        Garage garage = getOwnedGarage(garageId, garageAdmin);

        YearMonth currentMonth = YearMonth.now();
        LocalDate start = currentMonth.atDay(1);
        LocalDate end = currentMonth.atEndOfMonth();
        String periodLabel = currentMonth.format(
                DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH));

        long totalInterventions = interventionRepository
                .countByGarageAndInterventionDateBetween(garage, start, end);
        long completedInterventions = interventionRepository
                .countByGarageAndStatusAndInterventionDateBetween(garage, InterventionStatus.COMPLETED, start, end);
        long pendingAppointments = appointmentRepository
                .countByGarageAndStatus(garage, AppointmentStatus.PENDING);

        BigDecimal totalRevenueTTC = invoiceRepository.sumRevenueTTCByPeriod(garage, start, end);
        BigDecimal avgCost = interventionRepository.avgLaborCostByPeriod(garage, start, end);

        long stockAlerts = sparePartRepository.findLowStockByGarage(garage).size();

        String topTechnician = interventionRepository
                .findTechnicianStats(garage, start, end)
                .stream()
                .findFirst()
                .map(row -> row[0] + " " + row[1])
                .orElse(null);

        long upcomingMaintenanceCount = interventionRepository
                .findGarageClientVehiclesWithUpcomingExpiry(garage, LocalDate.now(), LocalDate.now().plusDays(30))
                .size();

        return new DashboardResponse(
                periodLabel,
                totalInterventions,
                completedInterventions,
                pendingAppointments,
                orZero(totalRevenueTTC),
                orZero(avgCost),
                stockAlerts,
                topTechnician,
                upcomingMaintenanceCount
        );
    }

    // ── Chiffre d'affaires ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RevenueResponse getRevenue(Long garageId, User garageAdmin,
                                      LocalDate startDate, LocalDate endDate) {
        Garage garage = getOwnedGarage(garageId, garageAdmin);
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début");
        }

        BigDecimal totalHT = invoiceRepository.sumRevenueHTByPeriod(garage, startDate, endDate);
        BigDecimal totalTTC = invoiceRepository.sumRevenueTTCByPeriod(garage, startDate, endDate);
        long count = invoiceRepository.countByGarageAndStatusAndIssueDateBetween(
                garage, InvoiceStatus.PAID, startDate, endDate);

        return new RevenueResponse(startDate, endDate, orZero(totalHT), orZero(totalTTC), count);
    }

    // ── Stats interventions ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InterventionStatsResponse getInterventionStats(Long garageId, User garageAdmin,
                                                          LocalDate startDate, LocalDate endDate) {
        Garage garage = getOwnedGarage(garageId, garageAdmin);

        long total = interventionRepository.countByGarageAndInterventionDateBetween(garage, startDate, endDate);
        long inProgress = interventionRepository.countByGarageAndStatusAndInterventionDateBetween(
                garage, InterventionStatus.IN_PROGRESS, startDate, endDate);
        long onHold = interventionRepository.countByGarageAndStatusAndInterventionDateBetween(
                garage, InterventionStatus.ON_HOLD, startDate, endDate);
        long completed = interventionRepository.countByGarageAndStatusAndInterventionDateBetween(
                garage, InterventionStatus.COMPLETED, startDate, endDate);

        BigDecimal totalLaborCost = interventionRepository.sumLaborCostByPeriod(garage, startDate, endDate);
        BigDecimal avgLaborCost = interventionRepository.avgLaborCostByPeriod(garage, startDate, endDate);

        List<TechnicianStat> byTechnician = interventionRepository
                .findTechnicianStats(garage, startDate, endDate)
                .stream()
                .map(row -> new TechnicianStat(row[0] + " " + row[1], (Long) row[2]))
                .toList();

        return new InterventionStatsResponse(
                total, inProgress, onHold, completed,
                orZero(totalLaborCost), orZero(avgLaborCost),
                byTechnician
        );
    }

    // ── Top services ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TopServiceResponse> getTopServices(Long garageId, User garageAdmin) {
        Garage garage = getOwnedGarage(garageId, garageAdmin);

        return invoiceRepository.findTopServicesByGarage(garage)
                .stream()
                .limit(10)
                .map(row -> new TopServiceResponse(
                        (String) row[0],
                        (Long) row[1],
                        orZero((BigDecimal) row[2])))
                .toList();
    }

    // ── Upcoming maintenance ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UpcomingMaintenanceResponse> getUpcomingMaintenance(Long garageId, User garageAdmin) {
        Garage garage = getOwnedGarage(garageId, garageAdmin);
        LocalDate today = LocalDate.now();

        return interventionRepository
                .findGarageClientVehiclesWithUpcomingExpiry(garage, today, today.plusDays(30))
                .stream()
                .map(ReportService::toMaintenanceResponse)
                .toList();
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getOwnedGarage(Long garageId, User owner) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Garage introuvable (id=" + garageId + ")"));
        if (!garage.getOwner().getId().equals(owner.getId())) {
            throw new EntityNotFoundException("Garage introuvable (id=" + garageId + ")");
        }
        return garage;
    }

    private static UpcomingMaintenanceResponse toMaintenanceResponse(Vehicle v) {
        return new UpcomingMaintenanceResponse(
                v.getId(),
                v.getLicensePlate(),
                v.getBrand(),
                v.getModel(),
                v.getOwner().fullName(),
                v.getOwner().getEmail(),
                v.getInsuranceExpiry(),
                v.getTechnicalInspectionExpiry()
        );
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
