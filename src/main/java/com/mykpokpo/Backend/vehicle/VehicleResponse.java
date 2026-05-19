package com.mykpokpo.Backend.vehicle;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleResponse(
        Long id,
        String licensePlate,
        String brand,
        String model,
        Integer year,
        FuelType fuelType,
        Integer currentMileage,
        String vin,
        LocalDate insuranceExpiry,
        LocalDate technicalInspectionExpiry,
        LocalDate nextServiceDate,
        Integer nextServiceMileage,
        LocalDateTime createdAt
) {
    public static VehicleResponse from(Vehicle v) {
        return new VehicleResponse(
                v.getId(),
                v.getLicensePlate(),
                v.getBrand(),
                v.getModel(),
                v.getYear(),
                v.getFuelType(),
                v.getCurrentMileage(),
                v.getVin(),
                v.getInsuranceExpiry(),
                v.getTechnicalInspectionExpiry(),
                v.getNextServiceDate(),
                v.getNextServiceMileage(),
                v.getCreatedAt()
        );
    }
}
