package com.mykpokpo.Backend.invoice;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.garage.GarageRepository;
import com.mykpokpo.Backend.intervention.Intervention;
import com.mykpokpo.Backend.intervention.InterventionRepository;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.user.UserRepository;
import com.mykpokpo.Backend.vehicle.Vehicle;
import com.mykpokpo.Backend.vehicle.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final GarageRepository garageRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final InterventionRepository interventionRepository;
    private final PdfService pdfService;

    // ── Création ──────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse create(InvoiceRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Véhicule introuvable (id=" + request.getVehicleId() + ")"));

        User client = userRepository.findById(request.getClientId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Client introuvable (id=" + request.getClientId() + ")"));

        Intervention intervention = null;
        if (request.getInterventionId() != null) {
            intervention = interventionRepository.findByIdAndGarage(request.getInterventionId(), garage)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Intervention introuvable (id=" + request.getInterventionId() + ")"));
        }

        LocalDate issueDate = request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now();
        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : new BigDecimal("0.18");
        String number = generateNumber(garage, request.getType(), issueDate);

        Invoice invoice = Invoice.builder()
                .garage(garage)
                .vehicle(vehicle)
                .client(client)
                .intervention(intervention)
                .type(request.getType())
                .taxRate(taxRate)
                .invoiceNumber(number)
                .issueDate(issueDate)
                .dueDate(request.getDueDate())
                .totalHT(BigDecimal.ZERO)
                .totalTTC(BigDecimal.ZERO)
                .build();

        List<InvoiceLine> lines = request.getLines().stream()
                .map(r -> buildLine(r, invoice))
                .toList();
        invoice.getLines().addAll(lines);
        computeTotals(invoice);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    // ── Lectures ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponse> findByGarage(Long garageId, User garageAdmin) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new EntityNotFoundException("Garage introuvable (id=" + garageId + ")"));
        if (!garage.getOwner().getId().equals(garageAdmin.getId())) {
            throw new EntityNotFoundException("Garage introuvable (id=" + garageId + ")");
        }
        return invoiceRepository.findByGarageOrderByIssueDateDesc(garage)
                .stream().map(InvoiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> findByClient(User client) {
        return invoiceRepository.findByClientOrderByIssueDateDesc(client)
                .stream().map(InvoiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse findById(Long id, User user) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable (id=" + id + ")"));
        checkAccess(invoice, user);
        return InvoiceResponse.from(invoice);
    }

    // ── Modification ──────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse updateStatus(Long id, InvoiceStatusRequest request, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Invoice invoice = invoiceRepository.findByIdAndGarage(id, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Facture introuvable ou accès non autorisé (id=" + id + ")"));

        InvoiceStatus current = invoice.getStatus();
        InvoiceStatus next = request.getStatus();

        boolean valid = switch (current) {
            case DRAFT -> next == InvoiceStatus.SENT;
            case SENT -> invoice.getType() == InvoiceType.DEVIS
                    ? (next == InvoiceStatus.ACCEPTED || next == InvoiceStatus.REJECTED)
                    : next == InvoiceStatus.PAID;
            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException("Transition invalide : " + current + " → " + next);
        }

        invoice.setStatus(next);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generatePdf(Long id, User user) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable (id=" + id + ")"));
        checkAccess(invoice, user);
        return pdfService.generate(invoice);
    }

    // ── Conversion DEVIS → FACTURE ────────────────────────────────────────────

    @Transactional
    public InvoiceResponse convert(Long id, User garageAdmin) {
        Garage garage = getOwnedGarage(garageAdmin);
        Invoice devis = invoiceRepository.findByIdAndGarage(id, garage)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Devis introuvable ou accès non autorisé (id=" + id + ")"));

        if (devis.getType() != InvoiceType.DEVIS) {
            throw new IllegalArgumentException("Ce document n'est pas un devis");
        }
        if (devis.getStatus() != InvoiceStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Seul un devis accepté peut être converti en facture (statut actuel : " + devis.getStatus() + ")");
        }

        LocalDate today = LocalDate.now();
        String number = generateNumber(garage, InvoiceType.FACTURE, today);

        Invoice facture = Invoice.builder()
                .garage(garage)
                .vehicle(devis.getVehicle())
                .client(devis.getClient())
                .intervention(devis.getIntervention())
                .type(InvoiceType.FACTURE)
                .taxRate(devis.getTaxRate())
                .invoiceNumber(number)
                .issueDate(today)
                .dueDate(devis.getDueDate())
                .totalHT(devis.getTotalHT())
                .totalTTC(devis.getTotalTTC())
                .build();

        List<InvoiceLine> lines = devis.getLines().stream()
                .map(l -> InvoiceLine.builder()
                        .invoice(facture)
                        .description(l.getDescription())
                        .quantity(l.getQuantity())
                        .unitPrice(l.getUnitPrice())
                        .totalPrice(l.getTotalPrice())
                        .build())
                .toList();
        facture.getLines().addAll(lines);

        return InvoiceResponse.from(invoiceRepository.save(facture));
    }

    // ── Utilitaires privés ────────────────────────────────────────────────────

    private Garage getOwnedGarage(User owner) {
        return garageRepository.findByOwner(owner)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Vous ne possédez pas de garage enregistré"));
    }

    private void checkAccess(Invoice invoice, User user) {
        boolean isClient = invoice.getClient().getId().equals(user.getId());
        boolean isGarageOwner = invoice.getGarage().getOwner().getId().equals(user.getId());
        if (!isClient && !isGarageOwner) {
            throw new EntityNotFoundException("Facture introuvable (id=" + invoice.getId() + ")");
        }
    }

    private String generateNumber(Garage garage, InvoiceType type, LocalDate date) {
        int year = date.getYear();
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        long count = invoiceRepository.countByGarageTypeAndYear(garage, type, start, end);
        String prefix = type == InvoiceType.FACTURE ? "FAC" : "DEV";
        return String.format("%s-%d-%04d", prefix, year, count + 1);
    }

    private InvoiceLine buildLine(InvoiceLineRequest r, Invoice invoice) {
        BigDecimal total = r.getUnitPrice().multiply(BigDecimal.valueOf(r.getQuantity()));
        return InvoiceLine.builder()
                .invoice(invoice)
                .description(r.getDescription())
                .quantity(r.getQuantity())
                .unitPrice(r.getUnitPrice())
                .totalPrice(total)
                .build();
    }

    private void computeTotals(Invoice invoice) {
        BigDecimal totalHT = invoice.getLines().stream()
                .map(InvoiceLine::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        invoice.setTotalHT(totalHT);
        invoice.setTotalTTC(totalHT.multiply(BigDecimal.ONE.add(invoice.getTaxRate())));
    }
}
