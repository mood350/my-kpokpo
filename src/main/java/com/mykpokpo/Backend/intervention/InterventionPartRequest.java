package com.mykpokpo.Backend.intervention;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class InterventionPartRequest {

    @NotNull(message = "La pièce est obligatoire")
    private Long sparePartId;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être supérieure à 0")
    private Integer quantity;

    private BigDecimal unitPrice;
}
