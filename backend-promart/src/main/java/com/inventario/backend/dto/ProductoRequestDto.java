package com.inventario.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoRequestDto {

    @NotBlank(message = "El código de serie es obligatorio")
    private String codigoSerie;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String categoria;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    private BigDecimal precio;

    private Integer idProveedor;
}

