package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdenCompraDto {
    private Integer  id;
    private String   numeroOrden;

    private Integer  proveedorId;
    private String   proveedorNombre;

    private LocalDate     fechaEmision;
    private LocalDate     fechaEstimadaEntrega;
    private String        estado;
    private String        observaciones;
    private BigDecimal    total;
    private Integer       cantidadProductos;

    private Integer trabajadorId;
    private String  trabajadorNombre;
    private String  trabajadorCargo;

    private Integer       evaluadorId;
    private String        evaluadorNombre;
    private LocalDateTime fechaEvaluacion;
    private String        motivoRechazo;
    private LocalDateTime fechaCompletado;

    private List<OrdenCompraDetalleDto> detalles;
}
