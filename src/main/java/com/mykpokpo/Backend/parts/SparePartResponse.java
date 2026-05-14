package com.mykpokpo.Backend.parts;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SparePartResponse(
        Long id,
        Long garageId,
        String name,
        String reference,
        String category,
        String brand,
        Integer currentStock,
        Integer minStockThreshold,
        boolean lowStock,
        BigDecimal purchasePrice,
        BigDecimal sellingPrice,
        String unit,
        LocalDateTime createdAt,
        LocalDateTime lastModifiedDate
) {
    public static SparePartResponse from(SparePart s) {
        return new SparePartResponse(
                s.getId(),
                s.getGarage().getId(),
                s.getName(),
                s.getReference(),
                s.getCategory(),
                s.getBrand(),
                s.getCurrentStock(),
                s.getMinStockThreshold(),
                s.getCurrentStock() <= s.getMinStockThreshold(),
                s.getPurchasePrice(),
                s.getSellingPrice(),
                s.getUnit(),
                s.getCreatedAt(),
                s.getLastModifiedDate()
        );
    }
}
