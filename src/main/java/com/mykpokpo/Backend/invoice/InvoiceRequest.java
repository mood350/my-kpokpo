package com.mykpokpo.Backend.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class InvoiceRequest {

    @NotNull(message = "Le véhicule est obligatoire")
    private Long vehicleId;

    @NotNull(message = "Le client est obligatoire")
    private Long clientId;

    private Long interventionId;

    @NotNull(message = "Le type est obligatoire (DEVIS ou FACTURE)")
    private InvoiceType type;

    @DecimalMin(value = "0.0", inclusive = true, message = "Le taux de taxe ne peut pas être négatif")
    @DecimalMax(value = "1.0", message = "Le taux de taxe ne peut pas dépasser 1.0 (= 100%)")
    private BigDecimal taxRate = new BigDecimal("0.18");

    private LocalDate issueDate;
    private LocalDate dueDate;

    @NotEmpty(message = "Au moins une ligne est obligatoire")
    @Valid
    private List<InvoiceLineRequest> lines;
}
