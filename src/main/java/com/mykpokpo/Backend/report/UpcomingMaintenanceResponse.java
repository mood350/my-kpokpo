package com.mykpokpo.Backend.report;

import java.time.LocalDate;

public record UpcomingMaintenanceResponse(
        Long vehicleId,
        String licensePlate,
        String brand,
        String model,
        String ownerName,
        String ownerEmail,
        LocalDate insuranceExpiry,
        LocalDate technicalInspectionExpiry
) {}
