package com.inventario.backend.controller;

import com.inventario.backend.dto.EvaluacionDto;
import com.inventario.backend.dto.OrdenCompraDto;
import com.inventario.backend.dto.OrdenCompraRequestDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.OrdenCompraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenCompraController {

    private final OrdenCompraService ordenCompraService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> crearOrden(
            @RequestBody OrdenCompraRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Orden creada correctamente",
                        ordenCompraService.crearOrden(request)));
    }

    @GetMapping("/mis-ordenes")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<List<OrdenCompraDto>>> listarMisOrdenes() {
        return ResponseEntity.ok(ApiResponse.ok("Mis órdenes obtenidas",
                ordenCompraService.listarMisOrdenes()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<OrdenCompraDto>>> listarOrdenes() {
        return ResponseEntity.ok(ApiResponse.ok("Órdenes obtenidas correctamente",
                ordenCompraService.listarOrdenes()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> obtenerOrden(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Orden encontrada",
                ordenCompraService.buscarPorId(id)));
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> aprobar(
            @PathVariable Integer id,
            @RequestBody(required = false) EvaluacionDto body) {
        return ResponseEntity.ok(ApiResponse.ok("Orden aprobada correctamente",
                ordenCompraService.aprobar(id, body)));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> rechazar(
            @PathVariable Integer id,
            @RequestBody EvaluacionDto body) {
        return ResponseEntity.ok(ApiResponse.ok("Orden rechazada",
                ordenCompraService.rechazar(id, body)));
    }

    @PatchMapping("/{id}/completar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> completar(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Orden completada — entradas registradas",
                ordenCompraService.completar(id)));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<OrdenCompraDto>> cancelar(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Orden cancelada",
                ordenCompraService.cancelar(id)));
    }
}
