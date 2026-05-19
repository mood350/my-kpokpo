package com.mykpokpo.Backend.invoice;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByGarageOrderByIssueDateDesc(Garage garage);

    List<Invoice> findByClientOrderByIssueDateDesc(User client);

    Optional<Invoice> findByIdAndGarage(Long id, Garage garage);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.garage = :garage AND i.type = :type " +
           "AND i.issueDate BETWEEN :start AND :end")
    long countByGarageTypeAndYear(
            @Param("garage") Garage garage,
            @Param("type") InvoiceType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    // ── Rapports ──────────────────────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(i.totalHT), 0) FROM Invoice i " +
           "WHERE i.garage = :garage AND i.status = 'PAID' AND i.issueDate BETWEEN :start AND :end")
    java.math.BigDecimal sumRevenueHTByPeriod(
            @Param("garage") Garage garage,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(i.totalTTC), 0) FROM Invoice i " +
           "WHERE i.garage = :garage AND i.status = 'PAID' AND i.issueDate BETWEEN :start AND :end")
    java.math.BigDecimal sumRevenueTTCByPeriod(
            @Param("garage") Garage garage,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    long countByGarageAndStatusAndIssueDateBetween(
            Garage garage, InvoiceStatus status, LocalDate start, LocalDate end);

    @Query("SELECT l.description, COUNT(l), COALESCE(SUM(l.totalPrice), 0) " +
           "FROM InvoiceLine l " +
           "WHERE l.invoice.garage = :garage AND l.invoice.status != 'DRAFT' " +
           "GROUP BY l.description " +
           "ORDER BY COUNT(l) DESC")
    List<Object[]> findTopServicesByGarage(@Param("garage") Garage garage);

    // ── Admin stats (plateforme entière) ─────────────────────────────────────

    @Query("SELECT COALESCE(SUM(i.totalTTC), 0) FROM Invoice i " +
           "WHERE i.status = 'PAID' AND i.issueDate BETWEEN :start AND :end")
    java.math.BigDecimal sumPlatformRevenueTTCByPeriod(
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end);

    @Query("SELECT COALESCE(SUM(i.totalTTC), 0) FROM Invoice i WHERE i.status = 'PAID'")
    java.math.BigDecimal sumTotalPlatformRevenueTTC();
}
