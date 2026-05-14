package com.mykpokpo.Backend.appointment;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findAllByClientOrderByRequestedDateDesc(User client);

    List<Appointment> findAllByGarageOrderByRequestedDateDesc(Garage garage);

    long countByGarageAndStatus(Garage garage, AppointmentStatus status);
}
