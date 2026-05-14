package com.mykpokpo.Backend.garage;

import java.time.LocalDateTime;

public record GarageResponse(
        Long id,
        String name,
        String phone,
        String email,
        String address,
        String city,
        String country,
        String description,
        String logoUrl,
        boolean verified,
        Double latitude,
        Double longitude,
        LocalDateTime createdAt
) {
    public static GarageResponse from(Garage g) {
        return new GarageResponse(
                g.getId(),
                g.getName(),
                g.getPhone(),
                g.getEmail(),
                g.getAddress(),
                g.getCity(),
                g.getCountry(),
                g.getDescription(),
                g.getLogoUrl(),
                g.isVerified(),
                g.getLatitude(),
                g.getLongitude(),
                g.getCreatedAt()
        );
    }
}
