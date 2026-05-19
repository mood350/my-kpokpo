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
     * Chaque jour à 8h00 : vérifie les échéances véhicule (assurance, CT, entretien)
     * qui surviennent dans exactement 30 ou 7 jours, plus le kilométrage atteint pour
     * le prochain entretien.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkVehicleExpiries() {
        LocalDate today = LocalDate.now();
        checkInsuranceExpiry(today.plusDays(30), 30);
        checkInsuranceExpiry(today.plusDays(7), 7);
        checkTechnicalInspectionExpiry(today.plusDays(30), 30);
        checkTechnicalInspectionExpiry(today.plusDays(7), 7);
        checkNextServiceDate(today.plusDays(30), 30);
        checkNextServiceDate(today.plusDays(7), 7);
        checkNextServiceMileage();
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

    /**
     * Rappel "vidange / entretien à prévoir" basé sur la date saisie par le client.
     */
    private void checkNextServiceDate(LocalDate serviceDate, int daysLeft) {
        List<Vehicle> vehicles = vehicleRepository.findByNextServiceDate(serviceDate);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(2);

        for (Vehicle v : vehicles) {
            notificationService.pushIfNotSentSince(
                    v.getOwner(),
                    "Entretien à prévoir",
                    "Pensez à programmer l'entretien de votre véhicule "
                            + v.getBrand() + " " + v.getModel()
                            + " (" + v.getLicensePlate() + ") — prévu dans " + daysLeft + " jour(s).",
                    "service_reminder",
                    v.getId(),
                    cutoff
            );
        }
    }

    /**
     * Si le kilométrage actuel a atteint ou dépassé le kilométrage cible saisi
     * pour le prochain entretien — notification une fois par semaine max.
     */
    private void checkNextServiceMileage() {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getNextServiceMileage() != null
                        && v.getCurrentMileage() != null
                        && v.getCurrentMileage() >= v.getNextServiceMileage())
                .toList();

        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        for (Vehicle v : vehicles) {
            notificationService.pushIfNotSentSince(
                    v.getOwner(),
                    "Kilométrage d'entretien atteint",
                    "Votre " + v.getBrand() + " " + v.getModel()
                            + " (" + v.getLicensePlate() + ") a atteint " + v.getCurrentMileage()
                            + " km. Un entretien est recommandé (seuil défini : "
                            + v.getNextServiceMileage() + " km).",
                    "service_reminder",
                    v.getId(),
                    cutoff
            );
        }
    }
}
