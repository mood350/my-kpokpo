package com.mykpokpo.Backend.appointment;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AppointmentActionRequest {

    private LocalDateTime confirmedDate;
    private String garageNotes;
}
