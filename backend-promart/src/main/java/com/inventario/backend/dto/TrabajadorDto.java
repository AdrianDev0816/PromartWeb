package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrabajadorDto {
    private Integer id;
    private String nombre;
    private String cargo;
    private String usuario;
    private String email;
    private String estado;
    private String rolNombre;
    private String iniciales;
}
