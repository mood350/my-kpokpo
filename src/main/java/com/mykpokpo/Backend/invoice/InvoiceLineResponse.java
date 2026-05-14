package com.mykpokpo.Backend.invoice;

import java.math.BigDecimal;

public record InvoiceLineResponse(
        Long id,
        String description,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
    public static InvoiceLineResponse from(InvoiceLine l) {
        return new InvoiceLineResponse(
                l.getId(),
                l.getDescription(),
                l.getQuantity(),
                l.getUnitPrice(),
                l.getTotalPrice()
        );
    }
}
