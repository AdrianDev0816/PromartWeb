package com.inventario.backend.service;

import com.inventario.backend.dto.EvaluacionDto;
import com.inventario.backend.dto.OrdenCompraDetalleDto;
import com.inventario.backend.dto.OrdenCompraDto;
import com.inventario.backend.dto.OrdenCompraRequestDto;
import com.inventario.backend.entity.*;
import com.inventario.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrdenCompraService {

    private final OrdenCompraRepository          ordenCompraRepository;
    private final OrdenCompraDetalleRepository   detalleRepository;
    private final ProveedorRepository            proveedorRepository;
    private final ProductoRepository             productoRepository;
    private final TrabajadorRepository           trabajadorRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final WebSocketNotificacionService   wsNotificacionService;
    private final AlertaService                  alertaService;

    // ── Crear orden ──────────────────────────────────────────────────────────
    @Transactional
    public OrdenCompraDto crearOrden(OrdenCompraRequestDto req) {
        Proveedor proveedor = proveedorRepository.findById(req.getIdProveedor())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        Trabajador solicitante = getTrabajadorActual();

        long total = ordenCompraRepository.count();
        String numero = String.format("OC-%03d", total + 1);

        OrdenCompra orden = OrdenCompra.builder()
                .numeroOrden(numero)
                .proveedor(proveedor)
                .fechaEmision(LocalDate.now())
                .fechaEstimadaEntrega(req.getFechaEstimadaEntrega())
                .estado(OrdenCompra.Estado.Pendiente)
                .observaciones(req.getObservaciones())
                .trabajador(solicitante)
                .build();

        List<OrdenCompraDetalle> detalles = req.getDetalles().stream().map(d -> {
            Producto producto = productoRepository.findById(d.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + d.getIdProducto()));
            BigDecimal subtotal = d.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(d.getCantidad()));
            return OrdenCompraDetalle.builder()
                    .ordenCompra(orden)
                    .producto(producto)
                    .cantidad(d.getCantidad())
                    .precioUnitario(d.getPrecioUnitario())
                    .subtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal totalMonto = detalles.stream()
                .map(OrdenCompraDetalle::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        orden.setTotal(totalMonto);

        OrdenCompra saved = ordenCompraRepository.save(orden);
        detalleRepository.saveAll(detalles.stream().peek(d -> d.setOrdenCompra(saved))
                .collect(Collectors.toList()));

        wsNotificacionService.notificarOrden("Orden creada", saved.getNumeroOrden());
        return toDto(saved, detalles);
    }

    // ── Listar todas (Supervisor / Admin) ────────────────────────────────────
    @Transactional(readOnly = true)
    public List<OrdenCompraDto> listarOrdenes() {
        return ordenCompraRepository.findAllConRelaciones().stream()
                .map(o -> toDto(o, detalleRepository.findByOrdenCompraId(o.getId())))
                .collect(Collectors.toList());
    }

    // ── Listar mis órdenes (cualquier rol) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<OrdenCompraDto> listarMisOrdenes() {
        Trabajador actual = getTrabajadorActual();
        return ordenCompraRepository.findByTrabajadorIdConRelaciones(actual.getId()).stream()
                .map(o -> toDto(o, detalleRepository.findByOrdenCompraId(o.getId())))
                .collect(Collectors.toList());
    }

    // ── Buscar por ID ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public OrdenCompraDto buscarPorId(Integer id) {
        OrdenCompra orden = ordenCompraRepository.findByIdConRelaciones(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        return toDto(orden, detalleRepository.findByOrdenCompraId(id));
    }

    // ── Aprobar ───────────────────────────────────────────────────────────────
    @Transactional
    public OrdenCompraDto aprobar(Integer id, EvaluacionDto req) {
        OrdenCompra orden = findOrFail(id);
        if (orden.getEstado() != OrdenCompra.Estado.Pendiente) {
            throw new RuntimeException("Solo se pueden aprobar órdenes en estado Pendiente");
        }
        Trabajador evaluador = getTrabajadorActual();
        orden.setEstado(OrdenCompra.Estado.Aprobada);
        orden.setEvaluador(evaluador);
        orden.setFechaEvaluacion(LocalDateTime.now());
        if (req != null && req.getComentario() != null && !req.getComentario().isBlank()) {
            String obs = orden.getObservaciones();
            orden.setObservaciones(obs == null ? req.getComentario()
                    : obs + " | Evaluación: " + req.getComentario());
        }
        OrdenCompra saved = ordenCompraRepository.save(orden);
        wsNotificacionService.notificarOrden("Orden aprobada", saved.getNumeroOrden());
        return toDto(saved, detalleRepository.findByOrdenCompraId(id));
    }

    // ── Rechazar ──────────────────────────────────────────────────────────────
    @Transactional
    public OrdenCompraDto rechazar(Integer id, EvaluacionDto req) {
        OrdenCompra orden = findOrFail(id);
        if (orden.getEstado() != OrdenCompra.Estado.Pendiente) {
            throw new RuntimeException("Solo se pueden rechazar órdenes en estado Pendiente");
        }
        if (req == null || req.getComentario() == null || req.getComentario().isBlank()) {
            throw new RuntimeException("Debe indicar el motivo de rechazo");
        }
        Trabajador evaluador = getTrabajadorActual();
        orden.setEstado(OrdenCompra.Estado.Rechazada);
        orden.setEvaluador(evaluador);
        orden.setFechaEvaluacion(LocalDateTime.now());
        orden.setMotivoRechazo(req.getComentario());
        OrdenCompra saved = ordenCompraRepository.save(orden);
        wsNotificacionService.notificarOrden("Orden rechazada", saved.getNumeroOrden());
        return toDto(saved, detalleRepository.findByOrdenCompraId(id));
    }

    // ── Completar ─────────────────────────────────────────────────────────────
    @Transactional
    public OrdenCompraDto completar(Integer id) {
        OrdenCompra orden = findOrFail(id);
        if (orden.getEstado() != OrdenCompra.Estado.Aprobada
                && orden.getEstado() != OrdenCompra.Estado.EnProceso) {
            throw new RuntimeException("Solo se pueden completar órdenes Aprobadas o En proceso");
        }
        Trabajador admin = getTrabajadorActual();
        List<OrdenCompraDetalle> detalles = detalleRepository.findByOrdenCompraId(id);

        for (OrdenCompraDetalle det : detalles) {
            Producto producto = det.getProducto();
            producto.setStockActual(producto.getStockActual() + det.getCantidad());
            productoRepository.save(producto);
            alertaService.resolverAlertasPorProducto(
                    producto.getId(), producto.getStockActual(), producto.getStockMinimo());

            MovimientoInventario mov = MovimientoInventario.builder()
                    .tipo(MovimientoInventario.Tipo.Entrada)
                    .motivo(MovimientoInventario.Motivo.Entrada)
                    .cantidad(det.getCantidad())
                    .fecha(LocalDate.now())
                    .producto(producto)
                    .trabajador(admin)
                    .observaciones("Orden de compra completada: " + orden.getNumeroOrden())
                    .build();
            movimientoRepository.save(mov);
        }

        orden.setEstado(OrdenCompra.Estado.Completada);
        orden.setFechaCompletado(LocalDateTime.now());
        OrdenCompra saved = ordenCompraRepository.save(orden);
        wsNotificacionService.notificarOrden("Orden completada — stock actualizado", saved.getNumeroOrden());
        return toDto(saved, detalles);
    }

    // ── Cancelar ──────────────────────────────────────────────────────────────
    @Transactional
    public OrdenCompraDto cancelar(Integer id) {
        OrdenCompra orden = findOrFail(id);
        if (orden.getEstado() == OrdenCompra.Estado.Completada
                || orden.getEstado() == OrdenCompra.Estado.Rechazada) {
            throw new RuntimeException("No se puede cancelar una orden Completada o Rechazada");
        }
        orden.setEstado(OrdenCompra.Estado.Cancelada);
        OrdenCompra saved = ordenCompraRepository.save(orden);
        wsNotificacionService.notificarOrden("Orden cancelada", saved.getNumeroOrden());
        return toDto(saved, detalleRepository.findByOrdenCompraId(id));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private OrdenCompra findOrFail(Integer id) {
        return ordenCompraRepository.findByIdConRelaciones(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
    }

    private Trabajador getTrabajadorActual() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return trabajadorRepository.findByUsuario(username)
                .orElseThrow(() -> new RuntimeException("Trabajador no encontrado"));
    }

    private OrdenCompraDto toDto(OrdenCompra o, List<OrdenCompraDetalle> detalles) {
        List<OrdenCompraDetalleDto> detalleDtos = detalles.stream().map(d ->
                OrdenCompraDetalleDto.builder()
                        .id(d.getId())
                        .productoId(d.getProducto().getId())
                        .productoNombre(d.getProducto().getNombre())
                        .productoCodigoSerie(d.getProducto().getCodigoSerie())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .build()
        ).collect(Collectors.toList());

        return OrdenCompraDto.builder()
                .id(o.getId())
                .numeroOrden(o.getNumeroOrden())
                .proveedorId(o.getProveedor().getId())
                .proveedorNombre(o.getProveedor().getNombre())
                .fechaEmision(o.getFechaEmision())
                .fechaEstimadaEntrega(o.getFechaEstimadaEntrega())
                .estado(o.getEstado().name())
                .observaciones(o.getObservaciones())
                .total(o.getTotal())
                .cantidadProductos(detalles.size())
                .trabajadorId(o.getTrabajador().getId())
                .trabajadorNombre(o.getTrabajador().getNombre())
                .trabajadorCargo(o.getTrabajador().getCargo().name())
                .evaluadorId(o.getEvaluador() != null ? o.getEvaluador().getId() : null)
                .evaluadorNombre(o.getEvaluador() != null ? o.getEvaluador().getNombre() : null)
                .fechaEvaluacion(o.getFechaEvaluacion())
                .motivoRechazo(o.getMotivoRechazo())
                .fechaCompletado(o.getFechaCompletado())
                .detalles(detalleDtos)
                .build();
    }
}
