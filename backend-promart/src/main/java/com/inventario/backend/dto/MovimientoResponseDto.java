package com.inventario.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoResponseDto {

  private Integer id;
    private String tipo;
    private String motivo;
    private LocalDate fecha;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal precioTotal;
    private String observaciones;
    private String trabajador;

    private Integer productoId;
    private String productoNombre;
    private String productoCategoria;
    private String productoCodigoSerie;

}
