package com.mykpokpo.Backend.intervention;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class InterventionRequest {

    private Long appointmentId;

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehicleId;

    private Long technicianId;

    private String diagnosis;
    private String workDescription;

    @NotNull(message = "La date d'intervention est obligatoire")
    @PastOrPresent(message = "La date d'intervention ne peut pas être dans le futur")
    private LocalDate interventionDate;

    private Integer mileageAtIntervention;
    private BigDecimal laborCost;
}
