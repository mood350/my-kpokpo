package com.mykpokpo.Backend.garage;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GarageRequest {

    @NotBlank(message = "Le nom du garage est obligatoire")
    private String name;

    private String phone;

    @Email(message = "Email invalide")
    private String email;

    private String address;

    @NotBlank(message = "La ville est obligatoire")
    private String city;

    private String country;

    private String description;

    private String logoUrl;

    private Double latitude;

    private Double longitude;
}
