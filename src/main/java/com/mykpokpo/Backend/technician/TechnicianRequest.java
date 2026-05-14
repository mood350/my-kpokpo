package com.mykpokpo.Backend.technician;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TechnicianRequest {

    @NotNull(message = "L'identifiant de l'utilisateur est obligatoire")
    private Long userId;

    @NotBlank(message = "La spécialité est obligatoire")
    private String specialty;

    private boolean available = true;
}
