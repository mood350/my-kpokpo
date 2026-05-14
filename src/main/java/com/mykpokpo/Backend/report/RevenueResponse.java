package com.mykpokpo.Backend.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalRevenueHT,
        BigDecimal totalRevenueTTC,
        long paidInvoiceCount
) {}
