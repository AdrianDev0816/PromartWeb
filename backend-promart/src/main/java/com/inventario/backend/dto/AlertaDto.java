package com.inventario.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertaDto {
    private Integer id;
    private Integer productoId;
    private String  productoNombre;
    private String  productoCategoria;
    private String  productoCodigo;
    private String  tipo;             // "Stock Crítico" | "Stock Mínimo" | "Sin Movimiento"
    private Integer stockActual;
    private Integer stockMinimo;
    private boolean leida;
    private boolean resuelta;
    private LocalDateTime fecha;
    private Integer trabajadorId;
    private String  trabajadorNombre;
    private LocalDateTime fechaResolucion;
}
