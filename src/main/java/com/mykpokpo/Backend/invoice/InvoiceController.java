package com.mykpokpo.Backend.invoice;

import com.mykpokpo.Backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    /** GARAGE_ADMIN — Créer un devis ou une facture */
    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @RequestBody @Valid InvoiceRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.create(request, user));
    }

    /** GARAGE_ADMIN — Toutes les factures/devis du garage */
    @GetMapping("/garage/{garageId}")
    public ResponseEntity<List<InvoiceResponse>> findByGarage(
            @PathVariable Long garageId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.findByGarage(garageId, user));
    }

    /** CLIENT — Mes factures/devis */
    @GetMapping("/client")
    public ResponseEntity<List<InvoiceResponse>> findByClient(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.findByClient(user));
    }

    /** CLIENT / GARAGE_ADMIN — Détail d'une facture */
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.findById(id, user));
    }

    /** GARAGE_ADMIN — Changer le statut (DRAFT→SENT→ACCEPTED/REJECTED/PAID) */
    @PutMapping("/{id}/status")
    public ResponseEntity<InvoiceResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid InvoiceStatusRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request, user));
    }

    /** CLIENT / GARAGE_ADMIN — Télécharger le PDF */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        byte[] pdf = invoiceService.generatePdf(id, user);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"document-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /** GARAGE_ADMIN — Convertir un devis accepté en facture */
    @PostMapping("/{id}/convert")
    public ResponseEntity<InvoiceResponse> convert(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.convert(id, user));
    }
}
