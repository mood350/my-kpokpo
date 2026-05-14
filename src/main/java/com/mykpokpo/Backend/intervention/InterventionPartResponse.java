package com.mykpokpo.Backend.intervention;

import java.math.BigDecimal;

public record InterventionPartResponse(
        Long id,
        Long sparePartId,
        String sparePartName,
        String sparePartReference,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
    public static InterventionPartResponse from(InterventionPart p) {
        return new InterventionPartResponse(
                p.getId(),
                p.getSparePart().getId(),
                p.getSparePart().getName(),
                p.getSparePart().getReference(),
                p.getQuantity(),
                p.getUnitPrice(),
                p.getUnitPrice().multiply(BigDecimal.valueOf(p.getQuantity()))
        );
    }
}
