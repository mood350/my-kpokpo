package com.mykpokpo.Backend.garage;

import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GarageRepository extends JpaRepository<Garage, Long> {

    Optional<Garage> findByOwner(User owner);

    boolean existsByOwner(User owner);

    List<Garage> findByCityContainingIgnoreCase(String city);
}
