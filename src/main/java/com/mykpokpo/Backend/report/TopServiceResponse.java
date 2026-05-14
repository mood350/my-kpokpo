package com.mykpokpo.Backend.report;

import java.math.BigDecimal;

public record TopServiceResponse(
        String description,
        long usageCount,
        BigDecimal totalRevenue
) {}
