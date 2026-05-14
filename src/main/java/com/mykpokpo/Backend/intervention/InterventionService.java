package com.mykpokpo.Backend.intervention;

import com.mykpokpo.Backend.appointment.Appointment;
import com.mykpokpo.Backend.appointment.AppointmentRepository;
import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.parts.MovementType;
import com.mykpokpo.Backend.parts.SparePart;
import com.mykpokpo.Backend.parts.SparePartRepository;
import com.mykpokpo.Backend.parts.StockMovement;
import com.mykpokpo.Backend.parts.StockMovementRepository;
import com.mykpokpo.Backend.technician.Technician;
import com.mykpokpo.Backend.technician.TechnicianRepository;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.vehicle.Vehicle;
import com.mykpokpo.Backend.vehicle.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final InterventionPartRepository interventionPartRepository;
    private final AppointmentRepository appointmentRepository;
    private final VehicleRepository vehicleRepository;
    private final GarageRepository garageRepository;
    private final TechnicianRepository technicianRepository;
    private final SparePartRepository sparePartRepository;
    private final StockMovementRepository stockMovementRepository;

    // ── Création ──────────────────────────────────────────────────────────────

    @Transactional
    public InterventionResponse create(InterventionRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Véhicule introuvable (id=" + request.getVehicleId() + ")"));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Rendez-vous introuvable (id=" + request.getAppointmentId() + ")"));
            if (!appointment.getGarage().getId().equals(garage.getId())) {
                throw new EntityNotFoundException(
                        "Rendez-vous introuvable (id=" + request.getAppointmentId() + ")");
            }
        }

        Technician technician = null;
        if (request.getTechnicianId() != null) {
            technician = getTechnicianOwnedByGarage(request.getTechnicianId(), garage);
        }

        Intervention intervention = Intervention.builder()
                .appointment(appointment)
                .vehicle(vehicle)
                .garage(garage)
                .assignedTechnician(technician)
                .diagnosis(request.getDiagnosis())
                .workDescription(request.getWorkDescription())
                .interventionDate(request.getInterventionDate())
                .mileageAtIntervention(request.getMileageAtIntervention())
                .laborCost(request.getLaborCost())
                .build();

        return InterventionResponse.from(interventionRepository.save(intervention));
    }

    // ── Lectures ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InterventionResponse> findByGarage(Long garageId, User garageAdmin) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException("Garage introuvable (id=" + garageId + ")"));
        if (!garage.getOwner().getId().equals(garageAdmin.getId())) {
            throw new EntityNotFoundException("Garage introuvable (id=" + garageId + ")");
        }
        return interventionRepository.findByGarageOrderByInterventionDateDesc(garage)
                .stream().map(InterventionResponse::from).toList();
    }

    /**
     * CLIENT → toutes les interventions du véhicule (propriétaire du véhicule).
     * GARAGE_ADMIN → interventions du véhicule dans son garage uniquement.
     */
    @Transactional(readOnly = true)
    public List<InterventionResponse> findByVehicle(Long vehicleId, User user) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Véhicule introuvable (id=" + vehicleId + ")"));

        if (vehicle.getOwner().getId().equals(user.getId())) {
            return interventionRepository.findByVehicleOrderByInterventionDateDesc(vehicle)
                    .stream().map(InterventionResponse::from).toList();
        }

        return garageRepository.findByOwner(user)
                .map(garage -> interventionRepository
                        .findByVehicleAndGarageOrderByInterventionDateDesc(vehicle, garage)
                        .stream().map(InterventionResponse::from).toList())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Véhicule introuvable ou accès non autorisé (id=" + vehicleId + ")"));
    }

    @Transactional(readOnly = true)
    public List<InterventionResponse> findMyInterventions(User techUser) {
        Technician technician = technicianRepository.findByUser(techUser)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun profil technicien associé à ce compte"));
        return interventionRepository.findByAssignedTechnicianOrderByInterventionDateDesc(technician)
                .stream().map(InterventionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InterventionResponse findById(Long id, User user) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Intervention introuvable (id=" + id + ")"));
        checkAccess(intervention, user);
        return InterventionResponse.from(intervention);
    }

    // ── Modification ──────────────────────────────────────────────────────────

    @Transactional
    public InterventionResponse update(Long id, InterventionUpdateRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Intervention intervention = getOwnedIntervention(id, garage);
        requireNotCompleted(intervention);

        if (request.getTechnicianId() != null) {
            intervention.setAssignedTechnician(
                    getTechnicianOwnedByGarage(request.getTechnicianId(), garage));
        } else {
            intervention.setAssignedTechnician(null);
        }
        if (request.getDiagnosis() != null) intervention.setDiagnosis(request.getDiagnosis());
        if (request.getWorkDescription() != null) intervention.setWorkDescription(request.getWorkDescription());
        if (request.getInterventionDate() != null) intervention.setInterventionDate(request.getInterventionDate());
        if (request.getMileageAtIntervention() != null) intervention.setMileageAtIntervention(request.getMileageAtIntervention());
        if (request.getLaborCost() != null) intervention.setLaborCost(request.getLaborCost());

        return InterventionResponse.from(interventionRepository.save(intervention));
    }

    @Transactional
    public InterventionResponse updateStatus(Long id, StatusUpdateRequest request, User user) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Intervention introuvable (id=" + id + ")"));

        checkGarageAdminOrAssignedTechnician(intervention, user);

        InterventionStatus current = intervention.getStatus();
        InterventionStatus next = request.getStatus();

        if (current == InterventionStatus.COMPLETED) {
            throw new IllegalArgumentException("Une intervention terminée ne peut plus changer de statut");
        }
        boolean validTransition = switch (current) {
            case IN_PROGRESS -> next == InterventionStatus.ON_HOLD || next == InterventionStatus.COMPLETED;
            case ON_HOLD -> next == InterventionStatus.IN_PROGRESS || next == InterventionStatus.COMPLETED;
            default -> false;
        };
        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Transition invalide : " + current + " → " + next);
        }

        intervention.setStatus(next);
        return InterventionResponse.from(interventionRepository.save(intervention));
    }

    // ── Pièces utilisées ──────────────────────────────────────────────────────

    @Transactional
    public InterventionResponse addPart(Long interventionId, InterventionPartRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Intervention intervention = getOwnedIntervention(interventionId, garage);
        requireNotCompleted(intervention);

        SparePart sparePart = sparePartRepository.findByIdAndGarage(request.getSparePartId(), garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Pièce introuvable (id=" + request.getSparePartId() + ")"));

        int qty = request.getQuantity();
        int updated = sparePartRepository.decrementStock(sparePart.getId(), qty);
        if (updated == 0) {
            // Recharger pour afficher le stock réel dans le message
            int available = sparePartRepository.findById(sparePart.getId())
                    .map(SparePart::getCurrentStock).orElse(0);
            throw new IllegalArgumentException(
                    "Stock insuffisant pour « " + sparePart.getName()
                            + " » (disponible: " + available + ", demandé: " + qty + ")");
        }

        BigDecimal price = request.getUnitPrice() != null
                ? request.getUnitPrice()
                : (sparePart.getSellingPrice() != null ? sparePart.getSellingPrice() : BigDecimal.ZERO);

        InterventionPart part = InterventionPart.builder()
                .intervention(intervention)
                .sparePart(sparePart)
                .quantity(qty)
                .unitPrice(price)
                .build();
        interventionPartRepository.save(part);

        StockMovement movement = StockMovement.builder()
                .sparePart(sparePart)
                .type(MovementType.OUT)
                .quantity(qty)
                .reason("Utilisé intervention #" + interventionId)
                .referenceId(interventionId)
                .createdBy(garageAdmin)
                .build();
        stockMovementRepository.save(movement);

        return InterventionResponse.from(interventionRepository.findById(interventionId).orElseThrow());
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getOwnedGarage(User owner) {
        return garageRepository.findByOwner(owner)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Vous ne possédez pas de garage enregistré"));
    }

    private Intervention getOwnedIntervention(Long id, Garage garage) {
        return interventionRepository.findByIdAndGarage(id, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Intervention introuvable ou accès non autorisé (id=" + id + ")"));
    }

    private Technician getTechnicianOwnedByGarage(Long technicianId, Garage garage) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Technicien introuvable (id=" + technicianId + ")"));
        if (!tech.getGarage().getId().equals(garage.getId())) {
            throw new EntityNotFoundException(
                    "Technicien introuvable ou accès non autorisé (id=" + technicianId + ")");
        }
        return tech;
    }

    private void checkAccess(Intervention intervention, User user) {
        boolean isVehicleOwner = intervention.getVehicle().getOwner().getId().equals(user.getId());
        boolean isGarageOwner = intervention.getGarage().getOwner().getId().equals(user.getId());
        if (!isVehicleOwner && !isGarageOwner) {
            throw new EntityNotFoundException("Intervention introuvable (id=" + intervention.getId() + ")");
        }
    }

    private void checkGarageAdminOrAssignedTechnician(Intervention intervention, User user) {
        boolean isGarageOwner = intervention.getGarage().getOwner().getId().equals(user.getId());
        boolean isAssignedTechnician = intervention.getAssignedTechnician() != null
                && intervention.getAssignedTechnician().getUser().getId().equals(user.getId());
        if (!isGarageOwner && !isAssignedTechnician) {
            throw new EntityNotFoundException("Intervention introuvable (id=" + intervention.getId() + ")");
        }
    }

    private void requireNotCompleted(Intervention intervention) {
        if (intervention.getStatus() == InterventionStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Impossible de modifier une intervention terminée");
        }
    }
}
