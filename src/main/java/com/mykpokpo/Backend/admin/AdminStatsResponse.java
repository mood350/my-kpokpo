package com.mykpokpo.Backend.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminStatsResponse(
        long totalGarages,
        long verifiedGarages,
        long newGaragesThisMonth,
        long totalGaragistes,
        long totalClients,
        long newGaragistesThisMonth,
        long totalInterventions,
        long interventionsThisMonth,
        BigDecimal mrrFcfa,
        BigDecimal totalRevenueFcfa,
        List<RecentGarageInfo> recentGarages
) {
    public record RecentGarageInfo(
            Long    id,
            String  name,
            String  city,
            String  ownerName,
            boolean verified,
            String  createdAt
    ) {}
}
