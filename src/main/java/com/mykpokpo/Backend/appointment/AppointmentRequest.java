package com.mykpokpo.Backend.appointment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AppointmentRequest {

    @NotNull(message = "L'identifiant du véhicule est obligatoire")
    private Long vehicleId;

    @NotNull(message = "L'identifiant du garage est obligatoire")
    private Long garageId;

    @NotNull(message = "La date souhaitée est obligatoire")
    @Future(message = "La date souhaitée doit être dans le futur")
    private LocalDateTime requestedDate;

    private String clientNotes;
}
