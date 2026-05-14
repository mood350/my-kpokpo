package com.mykpokpo.Backend.garage;

import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GarageService {

    private final GarageRepository garageRepository;
    private final WorkingHoursRepository workingHoursRepository;

    // ── CRUD Garage ───────────────────────────────────────────────────────────

    public GarageResponse create(GarageRequest request, User owner) {
        if (garageRepository.existsByOwner(owner)) {
            throw new IllegalArgumentException("Vous possédez déjà un garage enregistré");
        }

        Garage garage = Garage.builder()
                .owner(owner)
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry() != null ? request.getCountry() : "Togo")
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        return GarageResponse.from(garageRepository.save(garage));
    }

    public List<GarageResponse> findAll(String city) {
        List<Garage> garages = (city != null && !city.isBlank())
                ? garageRepository.findByCityContainingIgnoreCase(city)
                : garageRepository.findAll();

        return garages.stream().map(GarageResponse::from).toList();
    }

    public GarageResponse findById(Long id) {
        return GarageResponse.from(getGarageOrThrow(id));
    }

    @Transactional
    public GarageResponse update(Long id, GarageRequest request, User owner) {
        Garage garage = getOwnedGarage(id, owner);

        garage.setName(request.getName());
        garage.setPhone(request.getPhone());
        garage.setEmail(request.getEmail());
        garage.setAddress(request.getAddress());
        garage.setCity(request.getCity());
        if (request.getCountry() != null) garage.setCountry(request.getCountry());
        garage.setDescription(request.getDescription());
        garage.setLogoUrl(request.getLogoUrl());
        garage.setLatitude(request.getLatitude());
        garage.setLongitude(request.getLongitude());

        return GarageResponse.from(garageRepository.save(garage));
    }

    // ── Horaires ──────────────────────────────────────────────────────────────

    /**
     * Remplace tous les horaires existants du garage par ceux fournis.
     * Accepte entre 1 et 7 entrées (une par jour).
     */
    @Transactional
    public List<WorkingHoursResponse> setWorkingHours(Long garageId,
                                                      List<WorkingHoursRequest> requests,
                                                      User owner) {
        Garage garage = getOwnedGarage(garageId, owner);

        workingHoursRepository.deleteAllByGarage(garage);

        List<WorkingHours> hours = requests.stream()
                .map(r -> {
                    if (!r.isClosed() && (r.getOpenTime() == null || r.getCloseTime() == null)) {
                        throw new IllegalArgumentException(
                                "openTime et closeTime sont obligatoires pour un jour ouvert (%s)"
                                        .formatted(r.getDayOfWeek()));
                    }
                    if (!r.isClosed() && r.getOpenTime().isAfter(r.getCloseTime())) {
                        throw new IllegalArgumentException(
                                "openTime doit être avant closeTime (%s)".formatted(r.getDayOfWeek()));
                    }
                    return WorkingHours.builder()
                            .garage(garage)
                            .dayOfWeek(r.getDayOfWeek())
                            .openTime(r.isClosed() ? null : r.getOpenTime())
                            .closeTime(r.isClosed() ? null : r.getCloseTime())
                            .closed(r.isClosed())
                            .build();
                })
                .toList();

        return workingHoursRepository.saveAll(hours)
                .stream()
                .map(WorkingHoursResponse::from)
                .toList();
    }

    public List<WorkingHoursResponse> getWorkingHours(Long garageId) {
        Garage garage = getGarageOrThrow(garageId);
        return workingHoursRepository.findByGarageOrderByDayOfWeek(garage)
                .stream()
                .map(WorkingHoursResponse::from)
                .toList();
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getGarageOrThrow(Long id) {
        return garageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Garage introuvable (id=" + id + ")"));
    }

    private Garage getOwnedGarage(Long id, User owner) {
        Garage garage = getGarageOrThrow(id);
        if (!garage.getOwner().getId().equals(owner.getId())) {
            throw new EntityNotFoundException("Garage introuvable ou accès non autorisé (id=" + id + ")");
        }
        return garage;
    }
}
