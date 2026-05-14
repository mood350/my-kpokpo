package com.mykpokpo.Backend.invoice;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InvoiceStatusRequest {

    @NotNull(message = "Le statut est obligatoire")
    private InvoiceStatus status;
}
