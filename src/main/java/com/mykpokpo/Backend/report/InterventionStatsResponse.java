package com.mykpokpo.Backend.report;

import java.math.BigDecimal;
import java.util.List;

public record InterventionStatsResponse(
        long total,
        long inProgress,
        long onHold,
        long completed,
        BigDecimal totalLaborCost,
        BigDecimal averageLaborCost,
        List<TechnicianStat> byTechnician
) {}
