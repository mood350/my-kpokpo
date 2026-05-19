package com.mykpokpo.Backend.appointment;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.notification.NotificationService;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.vehicle.Vehicle;
import com.mykpokpo.Backend.vehicle.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VehicleRepository vehicleRepository;
    private final GarageRepository garageRepository;
    private final NotificationService notificationService;

    public AppointmentResponse create(AppointmentRequest request, User client) {
        Vehicle vehicle = vehicleRepository.findByIdAndOwner(request.getVehicleId(), client)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Véhicule introuvable (id=" + request.getVehicleId() + ")"));

        Garage garage = garageRepository.findById(request.getGarageId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Garage introuvable (id=" + request.getGarageId() + ")"));

        Appointment appointment = Appointment.builder()
                .client(client)
                .vehicle(vehicle)
                .garage(garage)
                .requestedDate(request.getRequestedDate())
                .clientNotes(request.getClientNotes())
                .build();

        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        // Notifie le propriétaire du garage de la nouvelle demande
        notificationService.push(
                garage.getOwner(),
                "Nouvelle demande de rendez-vous",
                client.fullName() + " demande un rendez-vous le "
                        + appointment.getRequestedDate() + " pour son "
                        + vehicle.getBrand() + " " + vehicle.getModel()
                        + " (" + vehicle.getLicensePlate() + ").",
                "appointment"
        );
        return response;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findMyAppointments(User client) {
        return appointmentRepository.findAllByClientOrderByRequestedDateDesc(client)
                .stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findByGarage(Long garageId, User owner) {
        Garage garage = getOwnedGarage(garageId, owner);
        return appointmentRepository.findAllByGarageOrderByRequestedDateDesc(garage)
                .stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id, User user) {
        Appointment appointment = getAppointmentOrThrow(id);
        checkClientOrGarageOwner(appointment, user);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse confirm(Long id, AppointmentActionRequest request, User owner) {
        Appointment appointment = getGarageAppointment(id, owner);
        requireStatus(appointment, AppointmentStatus.PENDING);

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setConfirmedDate(request.getConfirmedDate());
        if (request.getGarageNotes() != null) appointment.setGarageNotes(request.getGarageNotes());

        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        notificationService.push(
                appointment.getClient(),
                "Rendez-vous confirmé",
                "Votre rendez-vous au garage « " + appointment.getGarage().getName()
                        + " » a été confirmé pour le " + appointment.getConfirmedDate() + ".",
                "appointment"
        );
        return response;
    }

    @Transactional
    public AppointmentResponse reject(Long id, AppointmentActionRequest request, User owner) {
        Appointment appointment = getGarageAppointment(id, owner);
        requireStatus(appointment, AppointmentStatus.PENDING);

        appointment.setStatus(AppointmentStatus.REJECTED);
        if (request.getGarageNotes() != null) appointment.setGarageNotes(request.getGarageNotes());

        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        notificationService.push(
                appointment.getClient(),
                "Rendez-vous refusé",
                "Votre demande de rendez-vous au garage « " + appointment.getGarage().getName()
                        + " » a été refusée."
                        + (appointment.getGarageNotes() != null ? " Motif : " + appointment.getGarageNotes() : ""),
                "appointment"
        );
        return response;
    }

    @Transactional
    public AppointmentResponse reschedule(Long id, RescheduleRequest request, User owner) {
        Appointment appointment = getGarageAppointment(id, owner);
        if (appointment.getStatus() != AppointmentStatus.PENDING
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Impossible de reporter un rendez-vous avec le statut " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointment.setConfirmedDate(request.getConfirmedDate());
        if (request.getGarageNotes() != null) appointment.setGarageNotes(request.getGarageNotes());

        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        notificationService.push(
                appointment.getClient(),
                "Rendez-vous reprogrammé",
                "Le garage « " + appointment.getGarage().getName()
                        + " » a proposé un nouveau créneau le "
                        + appointment.getConfirmedDate() + "."
                        + (appointment.getGarageNotes() != null
                            ? " Note : " + appointment.getGarageNotes() : ""),
                "appointment"
        );
        return response;
    }

    @Transactional
    public AppointmentResponse cancel(Long id, User client) {
        Appointment appointment = getAppointmentOrThrow(id);
        if (!appointment.getClient().getId().equals(client.getId())) {
            throw new EntityNotFoundException("Rendez-vous introuvable (id=" + id + ")");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Impossible d'annuler un rendez-vous avec le statut " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        // Notifie le propriétaire du garage que le client a annulé
        notificationService.push(
                appointment.getGarage().getOwner(),
                "Rendez-vous annulé",
                "Le client " + appointment.getClient().fullName()
                        + " a annulé son rendez-vous du "
                        + appointment.getRequestedDate() + ".",
                "appointment"
        );
        return response;
    }

    @Transactional
    public AppointmentResponse complete(Long id, User owner) {
        Appointment appointment = getGarageAppointment(id, owner);
        requireStatus(appointment, AppointmentStatus.CONFIRMED);

        appointment.setStatus(AppointmentStatus.COMPLETED);
        AppointmentResponse response = AppointmentResponse.from(appointmentRepository.save(appointment));
        notificationService.push(
                appointment.getClient(),
                "Intervention terminée",
                "L'intervention sur votre " + appointment.getVehicle().getBrand()
                        + " " + appointment.getVehicle().getModel()
                        + " est terminée au garage « " + appointment.getGarage().getName() + " ».",
                "appointment"
        );
        return response;
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Appointment getAppointmentOrThrow(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rendez-vous introuvable (id=" + id + ")"));
    }

    private Garage getOwnedGarage(Long garageId, User owner) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException("Garage introuvable (id=" + garageId + ")"));
        if (!garage.getOwner().getId().equals(owner.getId())) {
            throw new EntityNotFoundException("Garage introuvable (id=" + garageId + ")");
        }
        return garage;
    }

    private Appointment getGarageAppointment(Long appointmentId, User owner) {
        Appointment appointment = getAppointmentOrThrow(appointmentId);
        if (!appointment.getGarage().getOwner().getId().equals(owner.getId())) {
            throw new EntityNotFoundException("Rendez-vous introuvable (id=" + appointmentId + ")");
        }
        return appointment;
    }

    private void checkClientOrGarageOwner(Appointment appointment, User user) {
        boolean isClient = appointment.getClient().getId().equals(user.getId());
        boolean isGarageOwner = appointment.getGarage().getOwner().getId().equals(user.getId());
        if (!isClient && !isGarageOwner) {
            throw new EntityNotFoundException("Rendez-vous introuvable (id=" + appointment.getId() + ")");
        }
    }

    private void requireStatus(Appointment appointment, AppointmentStatus expected) {
        if (appointment.getStatus() != expected) {
            throw new IllegalArgumentException(
                    "Action impossible : le rendez-vous est en statut " + appointment.getStatus());
        }
    }
}
