package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorRequestDto {
    private String nombre;
    private String ruc;
    private String contacto;
    private String telefono;
    private String correo;
    private String direccion;
    private String estado;
}
