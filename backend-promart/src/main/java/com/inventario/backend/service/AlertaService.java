package com.inventario.backend.service;

import com.inventario.backend.dto.AlertaDto;
import com.inventario.backend.entity.Alerta;
import com.inventario.backend.entity.Producto;
import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.AlertaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final AlertaRepository           alertaRepository;
    private final WebSocketNotificacionService wsService;

    // ─── Llamado desde MovimientoService al registrar SALIDA ─────────────────
    @Transactional
    public void procesarAlertaStockBajo(Producto producto, Trabajador trabajador) {
        int stock  = producto.getStockActual();
        int minimo = producto.getStockMinimo();

        if (stock > minimo) return;

        Alerta.Tipo tipo = (stock == 0 || stock <= (int) Math.floor(minimo * 0.5))
                ? Alerta.Tipo.STOCK_CRITICO
                : Alerta.Tipo.STOCK_MINIMO;

        // Evitar duplicar alerta del mismo tipo activa para el mismo producto
        List<Alerta> activas = alertaRepository.findActivasPorProducto(producto.getId());
        boolean yaExiste = activas.stream().anyMatch(a -> a.getTipo() == tipo);
        if (yaExiste) return;

        Alerta alerta = Alerta.builder()
                .producto(producto)
                .tipo(tipo)
                .stockActual(stock)
                .stockMinimo(minimo)
                .leida(false)
                .resuelta(false)
                .fecha(LocalDateTime.now())
                .trabajador(trabajador)
                .build();

        alertaRepository.save(alerta);
        wsService.notificarStockBajo(producto.getNombre(), stock, minimo);
    }

    // ─── Llamado desde MovimientoService (entrada) y OrdenCompraService (completar) ──
    @Transactional
    public void resolverAlertasPorProducto(Integer productoId, int nuevoStock, int stockMinimo) {
        if (nuevoStock <= stockMinimo) return;

        List<Alerta> activas = alertaRepository.findActivasPorProducto(productoId);
        if (activas.isEmpty()) return;

        LocalDateTime ahora = LocalDateTime.now();
        activas.forEach(a -> {
            a.setResuelta(true);
            a.setLeida(true);
            a.setFechaResolucion(ahora);
        });
        alertaRepository.saveAll(activas);
    }

    // ─── Endpoints ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AlertaDto> listarActivas() {
        return alertaRepository.findActivas().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertaDto> listarConFiltros(String tipo, Boolean leida, Boolean resuelta,
                                             LocalDateTime desde, LocalDateTime hasta) {
        Alerta.Tipo tipoEnum = (tipo != null && !tipo.isBlank())
                ? Alerta.Tipo.valueOf(tipo) : null;
        return alertaRepository.findConFiltros(tipoEnum, leida, resuelta, desde, hasta)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public AlertaDto marcarLeida(Integer id) {
        Alerta a = findOrFail(id);
        a.setLeida(true);
        return toDto(alertaRepository.save(a));
    }

    @Transactional
    public AlertaDto resolver(Integer id) {
        Alerta a = findOrFail(id);
        a.setResuelta(true);
        a.setLeida(true);
        a.setFechaResolucion(LocalDateTime.now());
        return toDto(alertaRepository.save(a));
    }

    @Transactional
    public void marcarTodasLeidas() {
        List<Alerta> activas = alertaRepository.findActivas();
        activas.forEach(a -> a.setLeida(true));
        alertaRepository.saveAll(activas);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Alerta findOrFail(Integer id) {
        return alertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada: " + id));
    }

    private AlertaDto toDto(Alerta a) {
        return AlertaDto.builder()
                .id(a.getId())
                .productoId(a.getProducto().getId())
                .productoNombre(a.getProducto().getNombre())
                .productoCategoria(a.getProducto().getCategoria())
                .productoCodigo(a.getProducto().getCodigoSerie())
                .tipo(formatTipo(a.getTipo()))
                .stockActual(a.getStockActual())
                .stockMinimo(a.getStockMinimo())
                .leida(a.isLeida())
                .resuelta(a.isResuelta())
                .fecha(a.getFecha())
                .trabajadorId(a.getTrabajador()     != null ? a.getTrabajador().getId() : null)
                .trabajadorNombre(a.getTrabajador() != null ? a.getTrabajador().getNombre() : null)
                .fechaResolucion(a.getFechaResolucion())
                .build();
    }

    private String formatTipo(Alerta.Tipo tipo) {
        switch (tipo) {
            case STOCK_CRITICO:   return "Stock Crítico";
            case STOCK_MINIMO:    return "Stock Mínimo";
            case SIN_MOVIMIENTO:  return "Sin Movimiento";
            default:              return tipo.name();
        }
    }
}
