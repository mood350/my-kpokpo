package com.mykpokpo.Backend.invoice;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.intervention.Intervention;
import com.mykpokpo.Backend.user.User;
import com.mykpokpo.Backend.utils.Listeners;
import com.mykpokpo.Backend.vehicle.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Invoice extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intervention_id", unique = true)
    private Intervention intervention;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceLine> lines = new ArrayList<>();

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalHT;

    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal taxRate = new BigDecimal("0.18");

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalTTC;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false)
    private LocalDate issueDate;

    private LocalDate dueDate;

    private String pdfUrl;
}
