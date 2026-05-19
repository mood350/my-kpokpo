package com.mykpokpo.Backend.vehicle;

import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleResponse create(VehicleRequest request, User owner) {
        Vehicle vehicle = Vehicle.builder()
                .owner(owner)
                .licensePlate(request.getLicensePlate().toUpperCase().trim())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .fuelType(request.getFuelType())
                .currentMileage(request.getCurrentMileage() != null ? request.getCurrentMileage() : 0)
                .vin(request.getVin())
                .insuranceExpiry(request.getInsuranceExpiry())
                .technicalInspectionExpiry(request.getTechnicalInspectionExpiry())
                .nextServiceDate(request.getNextServiceDate())
                .nextServiceMileage(request.getNextServiceMileage())
                .build();

        return VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    public List<VehicleResponse> findAllByOwner(User owner) {
        return vehicleRepository.findAllByOwner(owner)
                .stream()
                .map(VehicleResponse::from)
                .toList();
    }

    public VehicleResponse findById(Long id, User owner) {
        return VehicleResponse.from(getOwnedVehicle(id, owner));
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request, User owner) {
        Vehicle vehicle = getOwnedVehicle(id, owner);

        vehicle.setLicensePlate(request.getLicensePlate().toUpperCase().trim());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setCurrentMileage(request.getCurrentMileage());
        vehicle.setVin(request.getVin());
        vehicle.setInsuranceExpiry(request.getInsuranceExpiry());
        vehicle.setTechnicalInspectionExpiry(request.getTechnicalInspectionExpiry());
        vehicle.setNextServiceDate(request.getNextServiceDate());
        vehicle.setNextServiceMileage(request.getNextServiceMileage());

        return VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleResponse updateMileage(Long id, int mileage, User owner) {
        Vehicle vehicle = getOwnedVehicle(id, owner);

        if (vehicle.getCurrentMileage() != null && mileage < vehicle.getCurrentMileage()) {
            throw new IllegalArgumentException(
                    "Le nouveau kilométrage (%d) ne peut pas être inférieur à l'actuel (%d)"
                            .formatted(mileage, vehicle.getCurrentMileage())
            );
        }

        vehicle.setCurrentMileage(mileage);
        return VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    public void delete(Long id, User owner) {
        vehicleRepository.delete(getOwnedVehicle(id, owner));
    }

    // ── Utilitaire privé ──────────────────────────────────────────────────────

    private Vehicle getOwnedVehicle(Long id, User owner) {
        return vehicleRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Véhicule introuvable ou accès non autorisé (id=" + id + ")"
                ));
    }
}
