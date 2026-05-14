package com.mykpokpo.Backend.intervention;

import com.mykpokpo.Backend.appointment.Appointment;
import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.technician.Technician;
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
public class Intervention extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private Technician assignedTechnician;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String workDescription;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private InterventionStatus status = InterventionStatus.IN_PROGRESS;

    @Column(nullable = false)
    private LocalDate interventionDate;

    private Integer mileageAtIntervention;

    @Column(precision = 12, scale = 2)
    private BigDecimal laborCost;

    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterventionPart> partsUsed = new ArrayList<>();
}
