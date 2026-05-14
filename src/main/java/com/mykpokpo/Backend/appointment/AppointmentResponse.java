package com.mykpokpo.Backend.appointment;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        ClientInfo client,
        VehicleInfo vehicle,
        GarageInfo garage,
        LocalDateTime requestedDate,
        LocalDateTime confirmedDate,
        AppointmentStatus status,
        String clientNotes,
        String garageNotes,
        LocalDateTime createdAt
) {
    public record ClientInfo(Long id, String firstName, String lastName, String email) {}
    public record VehicleInfo(Long id, String licensePlate, String brand, String model) {}
    public record GarageInfo(Long id, String name, String city) {}

    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                new ClientInfo(
                        a.getClient().getId(),
                        a.getClient().getFirstName(),
                        a.getClient().getLastName(),
                        a.getClient().getEmail()
                ),
                new VehicleInfo(
                        a.getVehicle().getId(),
                        a.getVehicle().getLicensePlate(),
                        a.getVehicle().getBrand(),
                        a.getVehicle().getModel()
                ),
                new GarageInfo(
                        a.getGarage().getId(),
                        a.getGarage().getName(),
                        a.getGarage().getCity()
                ),
                a.getRequestedDate(),
                a.getConfirmedDate(),
                a.getStatus(),
                a.getClientNotes(),
                a.getGarageNotes(),
                a.getCreatedAt()
        );
    }
}
