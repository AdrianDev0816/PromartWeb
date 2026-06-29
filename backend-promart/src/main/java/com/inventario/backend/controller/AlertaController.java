package com.inventario.backend.controller;

import com.inventario.backend.dto.AlertaDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.AlertaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;

    // GET /api/alertas/activas — alertas no resueltas (para el módulo principal)
    @GetMapping("/activas")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<AlertaDto>>> listarActivas() {
        return ResponseEntity.ok(
                ApiResponse.ok("Alertas activas", alertaService.listarActivas()));
    }

    // GET /api/alertas?tipo=&leida=&resuelta=&desde=&hasta= — con filtros
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<AlertaDto>>> listarConFiltros(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Boolean leida,
            @RequestParam(required = false) Boolean resuelta,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return ResponseEntity.ok(
                ApiResponse.ok("Alertas filtradas",
                        alertaService.listarConFiltros(tipo, leida, resuelta, desde, hasta)));
    }

    // PATCH /api/alertas/{id}/marcar-leida
    @PatchMapping("/{id}/marcar-leida")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<AlertaDto>> marcarLeida(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Alerta marcada como leída", alertaService.marcarLeida(id)));
    }

    // PATCH /api/alertas/{id}/resolver
    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<AlertaDto>> resolver(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Alerta resuelta", alertaService.resolver(id)));
    }

    // PATCH /api/alertas/marcar-todas-leidas
    @PatchMapping("/marcar-todas-leidas")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<Void>> marcarTodasLeidas() {
        alertaService.marcarTodasLeidas();
        return ResponseEntity.ok(ApiResponse.ok("Todas marcadas como leídas", null));
    }
}
