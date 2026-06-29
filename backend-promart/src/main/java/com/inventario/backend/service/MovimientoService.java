package com.inventario.backend.service;

import com.inventario.backend.dto.MovimientoRequestDto;
import com.inventario.backend.dto.MovimientoResponseDto;
import com.inventario.backend.dto.ReporteResponseDto;
import com.inventario.backend.entity.MovimientoInventario;
import com.inventario.backend.entity.Producto;
import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.MovimientoInventarioRepository;
import com.inventario.backend.repository.ProductoRepository;
import com.inventario.backend.repository.TrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final WebSocketNotificacionService wsNotificacionService;
    private final AlertaService alertaService;

    // Registra entrada de productos
    @Transactional
    public MovimientoResponseDto registrarEntrada(MovimientoRequestDto request) {

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Trabajador trabajador = null;
        if (request.getTrabajadorId() != null) {
            trabajador = trabajadorRepository.findById(request.getTrabajadorId()).orElse(null);
        }

        // Suma al stock
        producto.setStockActual(producto.getStockActual() + request.getCantidad());
        productoRepository.save(producto);

        // Guarda el movimiento
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setTipo(MovimientoInventario.Tipo.Entrada);
        movimiento.setCantidad(request.getCantidad());
        movimiento.setFecha(LocalDate.now());
        movimiento.setProducto(producto);
        movimiento.setTrabajador(trabajador);
        if (request.getMotivo() != null && !request.getMotivo().isEmpty()) {
            movimiento.setMotivo(MovimientoInventario.Motivo.valueOf(request.getMotivo()));
        }
        movimiento.setObservaciones(request.getObservaciones());

        MovimientoResponseDto dto = convertirAMovimientoDto(movimientoRepository.save(movimiento));
        wsNotificacionService.notificarMovimiento(dto);
        // Si la entrada supera el mínimo, resolver alertas activas del producto
        alertaService.resolverAlertasPorProducto(
                producto.getId(), producto.getStockActual(), producto.getStockMinimo());
        return dto;
    }

    // Registra salida de productos
    @Transactional
    public MovimientoResponseDto registrarSalida(MovimientoRequestDto request) {

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Trabajador trabajador = null;
        if (request.getTrabajadorId() != null) {
            trabajador = trabajadorRepository.findById(request.getTrabajadorId()).orElse(null);
        }

        // Valida que haya stock suficiente
        if (producto.getStockActual() < request.getCantidad()) {
            throw new RuntimeException("Stock insuficiente. Stock actual: "
                    + producto.getStockActual());
        }

        // Resta al stock
        producto.setStockActual(producto.getStockActual() - request.getCantidad());
        productoRepository.save(producto);

        // Guarda el movimiento
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setTipo(MovimientoInventario.Tipo.Salida);
        movimiento.setCantidad(request.getCantidad());
        movimiento.setFecha(LocalDate.now());
        movimiento.setProducto(producto);
        movimiento.setTrabajador(trabajador);
        if (request.getMotivo() != null && !request.getMotivo().isEmpty()) {
            movimiento.setMotivo(MovimientoInventario.Motivo.valueOf(request.getMotivo()));
        }
        movimiento.setObservaciones(request.getObservaciones());

        MovimientoResponseDto dto = convertirAMovimientoDto(movimientoRepository.save(movimiento));
        wsNotificacionService.notificarMovimiento(dto);
        // Persistir alerta y notificar por WS si el stock quedó bajo mínimo
        alertaService.procesarAlertaStockBajo(producto, trabajador);
        return dto;
    }

    // Historial completo de movimientos
    @Transactional(readOnly = true)
    public List<MovimientoResponseDto> listarMovimientos() {
        return movimientoRepository.findAllConRelaciones()
                .stream()
                .map(this::convertirAMovimientoDto)
                .collect(Collectors.toList());
    }

    // Movimientos de un producto específico
    public List<MovimientoResponseDto> listarPorProducto(Integer productoId) {
        return movimientoRepository.findByProductoId(productoId)
                .stream()
                .map(this::convertirAMovimientoDto)
                .collect(Collectors.toList());
    }

    public ReporteResponseDto listarConFiltros(
            String motivo, LocalDate desde, LocalDate hasta) {

        MovimientoInventario.Motivo motivoEnum = null;
        if (motivo != null && !motivo.isEmpty()) {
            motivoEnum = MovimientoInventario.Motivo.valueOf(motivo);
        }

        List<MovimientoResponseDto> movimientos =
                movimientoRepository.filtrarMovimientos(motivoEnum, desde, hasta)
                        .stream()
                        .map(this::convertirAMovimientoDto)
                        .collect(Collectors.toList());

        // Calcula total y etiqueta segun motivo
        boolean mostrarTotal = motivoEnum == null ||
                (motivoEnum != MovimientoInventario.Motivo.Transferencia &&
                        motivoEnum != MovimientoInventario.Motivo.Ajuste);

        BigDecimal total = BigDecimal.ZERO;
        String etiqueta = "";

        if (mostrarTotal) {
            total = movimientos.stream()
                    .map(MovimientoResponseDto::getPrecioTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            etiqueta = obtenerEtiqueta(motivoEnum);
        }

        return new ReporteResponseDto(movimientos, total, etiqueta, mostrarTotal);
    }

    // Etiqueta segun motivo
    private String obtenerEtiqueta(MovimientoInventario.Motivo motivo) {
        if (motivo == null) return "Total General";
        switch (motivo) {
            case Venta:        return "Total Vendido";
            case Merma:        return "Total Perdido";
            case Entrada:      return "Total Invertido";
            case Devolucion:   return "Total Devuelto";
            default:           return "";
        }
    }

    // Convierte entidad a DTO
    private MovimientoResponseDto convertirAMovimientoDto(MovimientoInventario m) {
        BigDecimal precioUnitario = m.getProducto().getPrecio();
        BigDecimal cantidad = BigDecimal.valueOf(m.getCantidad());
        BigDecimal precioTotal = precioUnitario.multiply(cantidad);

        return MovimientoResponseDto.builder()
                .id(m.getId())
                .tipo(m.getTipo().name())
                .motivo(m.getMotivo() != null ? m.getMotivo().name() : null)
                .fecha(m.getFecha())
                .cantidad(m.getCantidad())
                .precioUnitario(precioUnitario)
                .precioTotal(precioTotal)
                .observaciones(m.getObservaciones())
                .trabajador(m.getTrabajador() != null ?
                        m.getTrabajador().getNombre() : null)
                .productoId(m.getProducto().getId())
                .productoNombre(m.getProducto().getNombre())
                .productoCategoria(m.getProducto().getCategoria())
                .productoCodigoSerie(m.getProducto().getCodigoSerie())
                .build();
    }
}
