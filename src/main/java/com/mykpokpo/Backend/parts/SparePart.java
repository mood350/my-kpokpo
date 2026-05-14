package com.mykpokpo.Backend.parts;

import com.mykpokpo.Backend.garage.Garage;
import com.mykpokpo.Backend.utils.Listeners;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class SparePart extends Listeners {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garage_id", nullable = false)
    private Garage garage;

    @Column(nullable = false)
    private String name;

    private String reference;
    private String category;
    private String brand;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentStock = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer minStockThreshold = 0;

    @Column(precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Builder.Default
    private String unit = "pièce";
}
