package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorDto {
    private Integer id;
    private String nombre;
    private String ruc;
    private String contacto;
    private String telefono;
    private String correo;
    private String direccion;
    private String estado;
    private Long cantidadProductos;
}
