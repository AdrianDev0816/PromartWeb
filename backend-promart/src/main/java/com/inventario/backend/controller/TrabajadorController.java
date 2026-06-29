package com.inventario.backend.controller;

import com.inventario.backend.dto.TrabajadorDto;
import com.inventario.backend.dto.TrabajadorRequestDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.TrabajadorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trabajadores")
@RequiredArgsConstructor
public class TrabajadorController {

    private final TrabajadorService trabajadorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<TrabajadorDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok("Trabajadores obtenidos correctamente",
                trabajadorService.listar()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<TrabajadorDto>> registrar(@RequestBody TrabajadorRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Trabajador registrado correctamente",
                        trabajadorService.registrar(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<TrabajadorDto>> editar(
            @PathVariable Integer id,
            @RequestBody TrabajadorRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Trabajador actualizado correctamente",
                trabajadorService.editar(id, request)));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<TrabajadorDto>> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Estado actualizado correctamente",
                trabajadorService.cambiarEstado(id, body.get("estado"))));
    }
}
