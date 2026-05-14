package com.mykpokpo.Backend.invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        InvoiceType type,
        InvoiceStatus status,
        Long garageId,
        String garageName,
        Long clientId,
        String clientName,
        String clientEmail,
        Long vehicleId,
        String vehicleLicensePlate,
        String vehicleBrand,
        String vehicleModel,
        Long interventionId,
        List<InvoiceLineResponse> lines,
        BigDecimal totalHT,
        BigDecimal taxRate,
        BigDecimal totalTTC,
        LocalDate issueDate,
        LocalDate dueDate,
        LocalDateTime createdAt,
        LocalDateTime lastModifiedDate
) {
    public static InvoiceResponse from(Invoice i) {
        return new InvoiceResponse(
                i.getId(),
                i.getInvoiceNumber(),
                i.getType(),
                i.getStatus(),
                i.getGarage().getId(),
                i.getGarage().getName(),
                i.getClient().getId(),
                i.getClient().fullName(),
                i.getClient().getEmail(),
                i.getVehicle().getId(),
                i.getVehicle().getLicensePlate(),
                i.getVehicle().getBrand(),
                i.getVehicle().getModel(),
                i.getIntervention() != null ? i.getIntervention().getId() : null,
                i.getLines().stream().map(InvoiceLineResponse::from).toList(),
                i.getTotalHT(),
                i.getTaxRate(),
                i.getTotalTTC(),
                i.getIssueDate(),
                i.getDueDate(),
                i.getCreatedAt(),
                i.getLastModifiedDate()
        );
    }
}
