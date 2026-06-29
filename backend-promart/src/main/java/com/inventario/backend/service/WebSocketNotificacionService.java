package com.inventario.backend.service;

import com.inventario.backend.dto.MovimientoResponseDto;
import com.inventario.backend.dto.NotificacionWsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebSocketNotificacionService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notificarMovimiento(MovimientoResponseDto mov) {
        String tipo = mov.getMotivo() != null ? mov.getMotivo() : mov.getTipo();
        NotificacionWsDto notif = NotificacionWsDto.builder()
                .tipo("MOVIMIENTO")
                .nivel("INFO")
                .mensaje(tipo + ": " + mov.getProductoNombre() + " (" + mov.getCantidad() + " uds)")
                .data(mov)
                .timestamp(LocalDateTime.now().toString())
                .build();
        messagingTemplate.convertAndSend("/topic/notificaciones", notif);
        messagingTemplate.convertAndSend("/topic/dashboard", Map.of("actualizar", true));
    }

    public void notificarOrden(String accion, String numeroOrden) {
        NotificacionWsDto notif = NotificacionWsDto.builder()
                .tipo("ORDEN")
                .nivel("INFO")
                .mensaje(accion + ": " + numeroOrden)
                .timestamp(LocalDateTime.now().toString())
                .build();
        messagingTemplate.convertAndSend("/topic/notificaciones", notif);
        messagingTemplate.convertAndSend("/topic/ordenes", notif);
        messagingTemplate.convertAndSend("/topic/dashboard", Map.of("actualizar", true));
    }

    public void notificarProducto(String accion, String nombreProducto) {
        NotificacionWsDto notif = NotificacionWsDto.builder()
                .tipo("PRODUCTO")
                .nivel("INFO")
                .mensaje(accion + ": " + nombreProducto)
                .timestamp(LocalDateTime.now().toString())
                .build();
        messagingTemplate.convertAndSend("/topic/notificaciones", notif);
        messagingTemplate.convertAndSend("/topic/dashboard", Map.of("actualizar", true));
    }

    public void notificarStockBajo(String nombre, int stockActual, int stockMinimo) {
        NotificacionWsDto notif = NotificacionWsDto.builder()
                .tipo("STOCK_BAJO")
                .nivel("WARNING")
                .mensaje("Stock bajo: " + nombre + " — " + stockActual + " uds (mín. " + stockMinimo + ")")
                .data(Map.of("nombre", nombre, "stockActual", stockActual, "stockMinimo", stockMinimo))
                .timestamp(LocalDateTime.now().toString())
                .build();
        messagingTemplate.convertAndSend("/topic/notificaciones", notif);
        messagingTemplate.convertAndSend("/topic/alertas", notif);
    }
}
