package com.mykpokpo.Backend.garage;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHoursResponse(
        Long id,
        DayOfWeek dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        boolean closed
) {
    public static WorkingHoursResponse from(WorkingHours wh) {
        return new WorkingHoursResponse(
                wh.getId(),
                wh.getDayOfWeek(),
                wh.getOpenTime(),
                wh.getCloseTime(),
                wh.isClosed()
        );
    }
}
