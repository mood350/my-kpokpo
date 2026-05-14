package com.mykpokpo.Backend.intervention;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.technician.Technician;
import com.mykpokpo.Backend.vehicle.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    List<Intervention> findByGarageOrderByInterventionDateDesc(Garage garage);

    List<Intervention> findByVehicleOrderByInterventionDateDesc(Vehicle vehicle);

    List<Intervention> findByVehicleAndGarageOrderByInterventionDateDesc(Vehicle vehicle, Garage garage);

    List<Intervention> findByAssignedTechnicianOrderByInterventionDateDesc(Technician technician);

    Optional<Intervention> findByIdAndGarage(Long id, Garage garage);

    // ── Rapports ──────────────────────────────────────────────────────────────

    long countByGarageAndInterventionDateBetween(Garage garage, LocalDate start, LocalDate end);

    long countByGarageAndStatusAndInterventionDateBetween(
            Garage garage, InterventionStatus status, LocalDate start, LocalDate end);

    long countByGarageAndStatus(Garage garage, InterventionStatus status);

    @Query("SELECT COALESCE(SUM(i.laborCost), 0) FROM Intervention i " +
           "WHERE i.garage = :garage AND i.interventionDate BETWEEN :start AND :end")
    java.math.BigDecimal sumLaborCostByPeriod(
            @Param("garage") Garage garage,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COALESCE(AVG(i.laborCost), 0) FROM Intervention i " +
           "WHERE i.garage = :garage AND i.interventionDate BETWEEN :start AND :end")
    java.math.BigDecimal avgLaborCostByPeriod(
            @Param("garage") Garage garage,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT i.assignedTechnician.user.firstName, i.assignedTechnician.user.lastName, COUNT(i) " +
           "FROM Intervention i " +
           "WHERE i.garage = :garage AND i.assignedTechnician IS NOT NULL " +
           "AND i.interventionDate BETWEEN :start AND :end " +
           "GROUP BY i.assignedTechnician.user.firstName, i.assignedTechnician.user.lastName " +
           "ORDER BY COUNT(i) DESC")
    List<Object[]> findTechnicianStats(
            @Param("garage") Garage garage,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT DISTINCT i.vehicle FROM Intervention i " +
           "WHERE i.garage = :garage " +
           "AND ((i.vehicle.insuranceExpiry IS NOT NULL AND i.vehicle.insuranceExpiry BETWEEN :today AND :limit) " +
           "  OR (i.vehicle.technicalInspectionExpiry IS NOT NULL AND i.vehicle.technicalInspectionExpiry BETWEEN :today AND :limit))")
    List<Vehicle> findGarageClientVehiclesWithUpcomingExpiry(
            @Param("garage") Garage garage,
            @Param("today") LocalDate today,
            @Param("limit") LocalDate limit);
}
