package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoRequestDto {

    private Integer productoId;
    private Integer cantidad;
    private Integer trabajadorId;
    private String motivo;
    private String observaciones;    
}
