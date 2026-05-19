package com.mykpokpo.Backend.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstname;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastname;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank(message = "Le rôle est obligatoire")
    @Pattern(regexp = "GARAGISTE|CLIENT", message = "Le rôle doit être GARAGISTE ou CLIENT")
    private String role;

    /** Obligatoire uniquement pour role=GARAGISTE */
    @Valid
    private GarageInfo garage;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GarageInfo {

        @NotBlank(message = "Le nom du garage est obligatoire")
        private String name;

        @NotBlank(message = "La ville est obligatoire")
        private String city;

        private String address;

        @Pattern(regexp = "\\+?[0-9 ]{7,20}", message = "Numéro de téléphone invalide")
        private String phone;

        @Email(message = "Email du garage invalide")
        private String email;

        private String country;

        private String description;
    }
}
