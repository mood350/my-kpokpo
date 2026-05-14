package com.mykpokpo.Backend.technician;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {

    List<Technician> findByGarage(Garage garage);

    Optional<Technician> findByUser(User user);

    boolean existsByUser(User user);

    Optional<Technician> findByIdAndGarage(Long id, Garage garage);
}
