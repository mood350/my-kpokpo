package com.mykpokpo.Backend.intervention;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StatusUpdateRequest {

    @NotNull(message = "Le statut est obligatoire")
    private InterventionStatus status;
}
