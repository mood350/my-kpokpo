package com.mykpokpo.Backend.parts;

import com.mykpokpo.Backend.garage.Garage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    List<SparePart> findByGarageOrderByNameAsc(Garage garage);

    Optional<SparePart> findByIdAndGarage(Long id, Garage garage);

    @Query("SELECT s FROM SparePart s WHERE s.garage = :garage AND s.currentStock <= s.minStockThreshold")
    List<SparePart> findLowStockByGarage(@Param("garage") Garage garage);

    @Query("SELECT s FROM SparePart s WHERE s.currentStock <= s.minStockThreshold")
    List<SparePart> findAllLowStock();

    @Modifying
    @Query("UPDATE SparePart s SET s.currentStock = s.currentStock - :qty WHERE s.id = :id AND s.currentStock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);
}
