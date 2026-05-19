package com.mykpokpo.Backend.admin;

public record AdminGarageResponse(
        Long    id,
        String  name,
        String  city,
        String  phone,
        String  email,
        String  address,
        String  ownerName,
        String  ownerEmail,
        boolean verified,
        String  createdAt
) {}
