package com.mykpokpo.Backend.parts;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementRequest {

    @NotNull(message = "Le type de mouvement est obligatoire")
    private MovementType type;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 0, message = "La quantité ne peut pas être négative")
    private Integer quantity;

    private String reason;

    private Long referenceId;
}
