package com.mykpokpo.Backend.parts;

import java.time.LocalDateTime;

public record StockMovementResponse(
        Long id,
        Long sparePartId,
        String sparePartName,
        MovementType type,
        Integer quantity,
        String reason,
        Long referenceId,
        Long createdById,
        String createdByName,
        LocalDateTime createdAt
) {
    public static StockMovementResponse from(StockMovement m) {
        return new StockMovementResponse(
                m.getId(),
                m.getSparePart().getId(),
                m.getSparePart().getName(),
                m.getType(),
                m.getQuantity(),
                m.getReason(),
                m.getReferenceId(),
                m.getCreatedBy().getId(),
                m.getCreatedBy().fullName(),
                m.getCreatedAt()
        );
    }
}
