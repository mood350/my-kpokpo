package com.mykpokpo.Backend.conseil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConseilRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    private String title;

    @NotBlank(message = "Le contenu est obligatoire")
    private String content;

    private String category;
}
