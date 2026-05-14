package com.mykpokpo.Backend.intervention;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InterventionResponse(
        Long id,
        Long appointmentId,
        Long vehicleId,
        String vehicleLicensePlate,
        String vehicleBrand,
        String vehicleModel,
        Long garageId,
        String garageName,
        Long technicianId,
        String technicianName,
        InterventionStatus status,
        String diagnosis,
        String workDescription,
        LocalDate interventionDate,
        Integer mileageAtIntervention,
        BigDecimal laborCost,
        List<InterventionPartResponse> partsUsed,
        BigDecimal totalPartsCost,
        LocalDateTime createdAt,
        LocalDateTime lastModifiedDate
) {
    public static InterventionResponse from(Intervention i) {
        List<InterventionPartResponse> parts = i.getPartsUsed()
                .stream()
                .map(InterventionPartResponse::from)
                .toList();

        BigDecimal totalParts = parts.stream()
                .map(InterventionPartResponse::totalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new InterventionResponse(
                i.getId(),
                i.getAppointment() != null ? i.getAppointment().getId() : null,
                i.getVehicle().getId(),
                i.getVehicle().getLicensePlate(),
                i.getVehicle().getBrand(),
                i.getVehicle().getModel(),
                i.getGarage().getId(),
                i.getGarage().getName(),
                i.getAssignedTechnician() != null ? i.getAssignedTechnician().getId() : null,
                i.getAssignedTechnician() != null ? i.getAssignedTechnician().getUser().fullName() : null,
                i.getStatus(),
                i.getDiagnosis(),
                i.getWorkDescription(),
                i.getInterventionDate(),
                i.getMileageAtIntervention(),
                i.getLaborCost(),
                parts,
                totalParts,
                i.getCreatedAt(),
                i.getLastModifiedDate()
        );
    }
}
