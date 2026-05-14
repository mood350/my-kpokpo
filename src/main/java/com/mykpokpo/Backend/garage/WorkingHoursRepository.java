package com.mykpokpo.Backend.garage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {

    List<WorkingHours> findByGarageOrderByDayOfWeek(Garage garage);

    void deleteAllByGarage(Garage garage);
}
