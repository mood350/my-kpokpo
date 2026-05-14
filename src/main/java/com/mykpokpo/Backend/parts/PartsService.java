package com.mykpokpo.Backend.parts;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartsService {

    private final SparePartRepository sparePartRepository;
    private final StockMovementRepository stockMovementRepository;
    private final GarageRepository garageRepository;

    // ── SparePart ─────────────────────────────────────────────────────────────

    public SparePartResponse createPart(SparePartRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);

        SparePart part = SparePart.builder()
                .garage(garage)
                .name(request.getName())
                .reference(request.getReference())
                .category(request.getCategory())
                .brand(request.getBrand())
                .minStockThreshold(request.getMinStockThreshold() != null ? request.getMinStockThreshold() : 0)
                .purchasePrice(request.getPurchasePrice())
                .sellingPrice(request.getSellingPrice())
                .unit(request.getUnit() != null ? request.getUnit() : "pièce")
                .build();

        return SparePartResponse.from(sparePartRepository.save(part));
    }

    public List<SparePartResponse> findByGarage(Long garageId, User garageAdmin) {
        Garage garage = getVerifiedGarage(garageId, garageAdmin);
        return sparePartRepository.findByGarageOrderByNameAsc(garage)
                .stream()
                .map(SparePartResponse::from)
                .toList();
    }

    public List<SparePartResponse> findLowStock(Long garageId, User garageAdmin) {
        Garage garage = getVerifiedGarage(garageId, garageAdmin);
        return sparePartRepository.findLowStockByGarage(garage)
                .stream()
                .map(SparePartResponse::from)
                .toList();
    }

    @Transactional
    public SparePartResponse update(Long id, SparePartRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        SparePart part = getOwnedPart(id, garage);

        part.setName(request.getName());
        part.setReference(request.getReference());
        part.setCategory(request.getCategory());
        part.setBrand(request.getBrand());
        if (request.getMinStockThreshold() != null) part.setMinStockThreshold(request.getMinStockThreshold());
        part.setPurchasePrice(request.getPurchasePrice());
        part.setSellingPrice(request.getSellingPrice());
        if (request.getUnit() != null) part.setUnit(request.getUnit());

        return SparePartResponse.from(sparePartRepository.save(part));
    }

    // ── StockMovement ─────────────────────────────────────────────────────────

    @Transactional
    public StockMovementResponse addMovement(Long partId, StockMovementRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        SparePart part = getOwnedPart(partId, garage);

        int qty = request.getQuantity();

        switch (request.getType()) {
            case IN -> {
                if (qty <= 0) throw new IllegalArgumentException("La quantité doit être supérieure à 0 pour une entrée");
                part.setCurrentStock(part.getCurrentStock() + qty);
            }
            case OUT -> {
                if (qty <= 0) throw new IllegalArgumentException("La quantité doit être supérieure à 0 pour une sortie");
                if (part.getCurrentStock() - qty < 0) {
                    throw new IllegalArgumentException(
                            "Stock insuffisant (disponible: " + part.getCurrentStock() + ", demandé: " + qty + ")");
                }
                part.setCurrentStock(part.getCurrentStock() - qty);
            }
            case ADJUSTMENT -> {
                if (qty < 0) throw new IllegalArgumentException("La quantité d'ajustement ne peut pas être négative");
                part.setCurrentStock(qty);
            }
        }

        sparePartRepository.save(part);

        StockMovement movement = StockMovement.builder()
                .sparePart(part)
                .type(request.getType())
                .quantity(qty)
                .reason(request.getReason())
                .referenceId(request.getReferenceId())
                .createdBy(garageAdmin)
                .build();

        return StockMovementResponse.from(stockMovementRepository.save(movement));
    }

    public List<StockMovementResponse> getMovements(Long partId, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        SparePart part = getOwnedPart(partId, garage);
        return stockMovementRepository.findBySparePartOrderByCreatedAtDesc(part)
                .stream()
                .map(StockMovementResponse::from)
                .toList();
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getOwnedGarage(User owner) {
        return garageRepository.findByOwner(owner)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Vous ne possédez pas de garage enregistré"));
    }

    private Garage getVerifiedGarage(Long garageId, User owner) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Garage introuvable (id=" + garageId + ")"));
        if (!garage.getOwner().getId().equals(owner.getId())) {
            throw new EntityNotFoundException(
                    "Garage introuvable ou accès non autorisé (id=" + garageId + ")");
        }
        return garage;
    }

    private SparePart getOwnedPart(Long partId, Garage garage) {
        return sparePartRepository.findByIdAndGarage(partId, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Pièce introuvable ou accès non autorisé (id=" + partId + ")"));
    }
}
