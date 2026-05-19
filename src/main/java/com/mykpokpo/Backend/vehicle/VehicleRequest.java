package com.mykpokpo.Backend.vehicle;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "La plaque d'immatriculation est obligatoire")
    private String licensePlate;

    @NotBlank(message = "La marque est obligatoire")
    private String brand;

    @NotBlank(message = "Le modèle est obligatoire")
    private String model;

    @NotNull(message = "L'année est obligatoire")
    @Min(value = 1900, message = "L'année doit être supérieure à 1900")
    @Max(value = 2100, message = "L'année semble incorrecte")
    private Integer year;

    @NotNull(message = "Le type de carburant est obligatoire")
    private FuelType fuelType;

    @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
    private Integer currentMileage;

    private String vin;

    private LocalDate insuranceExpiry;

    private LocalDate technicalInspectionExpiry;

    private LocalDate nextServiceDate;

    @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
    private Integer nextServiceMileage;
}
