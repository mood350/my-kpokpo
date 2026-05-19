package com.mykpokpo.Backend.user;

public record UserProfileResponse(
        Long   id,
        String firstName,
        String lastName,
        String email,
        String role,
        String garageName,
        Long   garageId
) {
    public static UserProfileResponse from(User user, String garageName, Long garageId) {
        String role = user.getRoles().stream()
                .map(r -> r.getRoleName())
                .findFirst()
                .orElse("USER");

        return new UserProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                role,
                garageName,
                garageId
        );
    }
}
