package com.mykpokpo.Backend.invoice;

public enum InvoiceStatus {
    DRAFT,
    SENT,
    ACCEPTED,   // DEVIS seulement
    REJECTED,   // DEVIS seulement
    PAID        // FACTURE seulement
}
