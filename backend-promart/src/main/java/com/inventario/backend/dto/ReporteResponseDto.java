package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteResponseDto {

    private List<MovimientoResponseDto> movimientos;
    private BigDecimal total;
    private String etiquetaTotal;
    private Boolean mostrarTotal;
    
}
