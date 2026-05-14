package com.mykpokpo.Backend.garage;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class WorkingHoursRequest {

    @NotNull(message = "Le jour de la semaine est obligatoire")
    private DayOfWeek dayOfWeek;

    private LocalTime openTime;

    private LocalTime closeTime;

    private boolean closed;
}
