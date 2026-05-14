package com.mykpokpo.Backend.parts;

public enum MovementType {
    IN,         // entrée stock (achat, retour)
    OUT,        // sortie stock (utilisé en intervention)
    ADJUSTMENT  // ajustement manuel (inventaire physique)
}
