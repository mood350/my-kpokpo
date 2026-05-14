package com.mykpokpo.Backend.vehicle;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MileageUpdateRequest {

    @NotNull(message = "Le kilométrage est obligatoire")
    @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
    private Integer currentMileage;
}
