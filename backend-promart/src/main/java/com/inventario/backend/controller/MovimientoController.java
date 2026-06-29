package com.inventario.backend.controller;

import com.inventario.backend.dto.MovimientoRequestDto;
import com.inventario.backend.dto.MovimientoResponseDto;
import com.inventario.backend.dto.ReporteResponseDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.MovimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService movimientoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<List<MovimientoResponseDto>>> listarMovimientos() {
        return ResponseEntity.ok(ApiResponse.ok("Movimientos obtenidos correctamente",
                movimientoService.listarMovimientos()));
    }

    @GetMapping("/producto/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<List<MovimientoResponseDto>>> listarPorProducto(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Movimientos del producto obtenidos",
                movimientoService.listarPorProducto(id)));
    }

    @GetMapping("/reporte")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<ReporteResponseDto>> obtenerReporte(
            @RequestParam(required = false) String motivo,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.ok("Reporte generado correctamente",
                movimientoService.listarConFiltros(motivo, desde, hasta)));
    }

    @PostMapping("/entrada")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<MovimientoResponseDto>> registrarEntrada(
            @RequestBody MovimientoRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Entrada registrada correctamente",
                movimientoService.registrarEntrada(request)));
    }

    @PostMapping("/salida")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<MovimientoResponseDto>> registrarSalida(
            @RequestBody MovimientoRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Salida registrada correctamente",
                movimientoService.registrarSalida(request)));
    }
}
