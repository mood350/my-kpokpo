package com.mykpokpo.Backend.parts;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class SparePartRequest {

    @NotBlank(message = "Le nom de la pièce est obligatoire")
    private String name;

    private String reference;
    private String category;
    private String brand;

    @Min(value = 0, message = "Le seuil d'alerte ne peut pas être négatif")
    private Integer minStockThreshold = 0;

    @DecimalMin(value = "0.0", inclusive = true, message = "Le prix d'achat ne peut pas être négatif")
    private BigDecimal purchasePrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Le prix de vente ne peut pas être négatif")
    private BigDecimal sellingPrice;

    private String unit = "pièce";
}
