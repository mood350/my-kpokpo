package com.mykpokpo.Backend.report;

import java.math.BigDecimal;

public record DashboardResponse(
        String periodLabel,
        long totalInterventions,
        long completedInterventions,
        long pendingAppointments,
        BigDecimal totalRevenueTTC,
        BigDecimal averageInterventionCost,
        long stockAlerts,
        String topTechnician,
        long upcomingMaintenanceCount
) {}
