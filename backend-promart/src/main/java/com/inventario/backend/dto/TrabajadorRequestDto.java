package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrabajadorRequestDto {
    private String nombre;
    private String cargo;
    private String usuario;
    private String clave;
    private String estado;
}
