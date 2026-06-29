package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoDto {

    private Integer id;
    private String codigoSerie;
    private String nombre;
    private String categoria;
    private Integer stockActual;
    private Integer stockMinimo;
    private BigDecimal precio;
    private String estado;
    private String proveedor;
    private Integer proveedorId;
}
