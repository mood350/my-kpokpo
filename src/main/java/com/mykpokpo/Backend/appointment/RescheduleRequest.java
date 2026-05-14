package com.mykpokpo.Backend.appointment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RescheduleRequest {

    @NotNull(message = "La nouvelle date est obligatoire")
    @Future(message = "La nouvelle date doit être dans le futur")
    private LocalDateTime confirmedDate;

    private String garageNotes;
}
