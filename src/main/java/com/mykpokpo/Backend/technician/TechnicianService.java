package com.mykpokpo.Backend.technician;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.role.Role;
import com.mykpokpo.Backend.role.RoleRepository;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final GarageRepository garageRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public TechnicianResponse addTechnician(TechnicianRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);

        User techUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Utilisateur introuvable (id=" + request.getUserId() + ")"));

        if (technicianRepository.existsByUser(techUser)) {
            throw new IllegalArgumentException(
                    "Cet utilisateur est déjà enregistré comme technicien");
        }

        boolean hasTechnicianRole = techUser.getRoles().stream()
                .anyMatch(r -> "TECHNICIAN".equals(r.getRoleName()));
        if (!hasTechnicianRole) {
            Role techRole = roleRepository.findByRoleName("TECHNICIAN")
                    .orElseThrow(() -> new RuntimeException("Rôle TECHNICIAN introuvable en BDD"));
            techUser.getRoles().add(techRole);
            userRepository.save(techUser);
        }

        Technician technician = Technician.builder()
                .user(techUser)
                .garage(garage)
                .specialty(request.getSpecialty())
                .available(request.isAvailable())
                .build();

        return TechnicianResponse.from(technicianRepository.save(technician));
    }

    public List<TechnicianResponse> findByGarage(Long garageId, User garageAdmin) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Garage introuvable (id=" + garageId + ")"));

        if (!garage.getOwner().getId().equals(garageAdmin.getId())) {
            throw new EntityNotFoundException(
                    "Garage introuvable ou accès non autorisé (id=" + garageId + ")");
        }

        return technicianRepository.findByGarage(garage)
                .stream()
                .map(TechnicianResponse::from)
                .toList();
    }

    @Transactional
    public TechnicianResponse update(Long id, TechnicianUpdateRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Technician technician = technicianRepository.findByIdAndGarage(id, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Technicien introuvable ou accès non autorisé (id=" + id + ")"));

        technician.setSpecialty(request.getSpecialty());
        technician.setAvailable(request.isAvailable());

        return TechnicianResponse.from(technicianRepository.save(technician));
    }

    @Transactional
    public void delete(Long id, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Technician technician = technicianRepository.findByIdAndGarage(id, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Technicien introuvable ou accès non autorisé (id=" + id + ")"));

        technicianRepository.delete(technician);
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getOwnedGarage(User owner) {
        return garageRepository.findByOwner(owner)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Vous ne possédez pas de garage enregistré"));
    }
}
