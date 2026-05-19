package com.mykpokpo.Backend.admin;

public record AdminUserResponse(
        Long    id,
        String  firstName,
        String  lastName,
        String  email,
        String  role,
        boolean enabled,
        String  createdAt,
        String  garageName
) {}
