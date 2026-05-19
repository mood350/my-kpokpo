package com.mykpokpo.Backend.dashboard;

import com.mykpokpo.Backend.appointment.AppointmentResponse;
import com.mykpokpo.Backend.intervention.InterventionResponse;
import com.mykpokpo.Backend.parts.SparePartResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        KpiSummary kpi,
        List<RevenuePoint> revenueChart,
        List<InterventionResponse> recentInterventions,
        List<AppointmentResponse> todayAppointments,
        List<SparePartResponse> criticalStock
) {
    public record KpiSummary(
            long interventionsThisMonth,
            Integer interventionsTrend,
            BigDecimal revenueThisMonth,
            Integer revenueTrend,
            long pendingAppointments,
            long stockAlerts
    ) {}

    public record RevenuePoint(String month, BigDecimal total) {}
}
