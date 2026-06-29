package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdenCompraRequestDto {
    private Integer   idProveedor;
    private LocalDate fechaEstimadaEntrega;
    private String    observaciones;
    private List<OrdenCompraDetalleRequestDto> detalles;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrdenCompraDetalleRequestDto {
        private Integer    idProducto;
        private Integer    cantidad;
        private BigDecimal precioUnitario;
    }
}
