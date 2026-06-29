package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionWsDto {
    private String tipo;      // MOVIMIENTO | STOCK_BAJO
    private String nivel;     // INFO | WARNING
    private String mensaje;
    private Object data;
    private String timestamp;
}
