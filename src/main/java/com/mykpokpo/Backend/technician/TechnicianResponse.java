package com.mykpokpo.Backend.technician;

import java.time.LocalDateTime;

public record TechnicianResponse(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        String email,
        Long garageId,
        String specialty,
        boolean available,
        LocalDateTime createdAt
) {
    public static TechnicianResponse from(Technician t) {
        return new TechnicianResponse(
                t.getId(),
                t.getUser().getId(),
                t.getUser().getFirstName(),
                t.getUser().getLastName(),
                t.getUser().getEmail(),
                t.getGarage().getId(),
                t.getSpecialty(),
                t.isAvailable(),
                t.getCreatedAt()
        );
    }
}
