package com.mykpokpo.Backend.vehicle;

import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findAllByOwner(User owner);

    Optional<Vehicle> findByIdAndOwner(Long id, User owner);

    List<Vehicle> findByInsuranceExpiry(LocalDate date);

    List<Vehicle> findByTechnicalInspectionExpiry(LocalDate date);

    List<Vehicle> findByNextServiceDate(LocalDate date);
}
