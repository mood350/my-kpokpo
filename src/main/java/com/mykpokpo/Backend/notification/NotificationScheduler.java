package com.mykpokpo.Backend.notification;

import com.mykpokpo.Backend.parts.SparePart;
import com.mykpokpo.Backend.parts.SparePartRepository;
import com.mykpokpo.Backend.vehicle.Vehicle;
import com.mykpokpo.Backend.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;
    private final VehicleRepository vehicleRepository;
    private final SparePartRepository sparePartRepository;

    /**
     * Chaque jour à 8h00 : vérifie les assurances et contrôles techniques
     * qui expirent dans exactement 30 ou 7 jours.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkVehicleExpiries() {
        LocalDate today = LocalDate.now();
        checkInsuranceExpiry(today.plusDays(30), 30);
        checkInsuranceExpiry(today.plusDays(7), 7);
        checkTechnicalInspectionExpiry(today.plusDays(30), 30);
        checkTechnicalInspectionExpiry(today.plusDays(7), 7);
    }

    /**
     * Chaque jour à 8h30 : vérifie les pièces dont le stock est sous le seuil
     * et notifie le propriétaire du garage.
     */
    @Scheduled(cron = "0 30 8 * * *")
    @Transactional
    public void checkLowStock() {
        List<SparePart> lowStockParts = sparePartRepository.findAllLowStock();
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        for (SparePart part : lowStockParts) {
            notificationService.pushIfNotSentSince(
                    part.getGarage().getOwner(),
                    "Stock bas : " + part.getName(),
                    "Le stock de « " + part.getName() + " » est bas ("
                            + part.getCurrentStock() + " " + part.getUnit()
                            + " restant(s), seuil = " + part.getMinStockThreshold() + ").",
                    "stock_alert",
                    part.getId(),
                    oneDayAgo
            );
        }
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private void checkInsuranceExpiry(LocalDate expiryDate, int daysLeft) {
        List<Vehicle> vehicles = vehicleRepository.findByInsuranceExpiry(expiryDate);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(2);

        for (Vehicle v : vehicles) {
            notificationService.pushIfNotSentSince(
                    v.getOwner(),
                    "Assurance bientôt expirée",
                    "L'assurance de votre véhicule " + v.getBrand() + " " + v.getModel()
                            + " (" + v.getLicensePlate() + ") expire dans " + daysLeft + " jour(s).",
                    "maintenance_reminder",
                    v.getId(),
                    cutoff
            );
        }
    }

    private void checkTechnicalInspectionExpiry(LocalDate expiryDate, int daysLeft) {
        List<Vehicle> vehicles = vehicleRepository.findByTechnicalInspectionExpiry(expiryDate);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(2);

        for (Vehicle v : vehicles) {
            notificationService.pushIfNotSentSince(
                    v.getOwner(),
                    "Contrôle technique bientôt expiré",
                    "Le contrôle technique de votre véhicule " + v.getBrand() + " " + v.getModel()
                            + " (" + v.getLicensePlate() + ") expire dans " + daysLeft + " jour(s).",
                    "maintenance_reminder",
                    v.getId(),
                    cutoff
            );
        }
    }
}
