package com.inventario.backend.controller;

import com.inventario.backend.dto.ProveedorDto;
import com.inventario.backend.dto.ProveedorRequestDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.ProveedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
public class ProveedorController {

    private final ProveedorService proveedorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProveedorDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok("Proveedores obtenidos correctamente",
                proveedorService.listar()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProveedorDto>> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Proveedor encontrado",
                proveedorService.buscarPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProveedorDto>> registrar(@RequestBody ProveedorRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Proveedor registrado correctamente",
                        proveedorService.registrar(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProveedorDto>> editar(
            @PathVariable Integer id,
            @RequestBody ProveedorRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Proveedor actualizado correctamente",
                proveedorService.editar(id, request)));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ProveedorDto>> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Estado actualizado correctamente",
                proveedorService.cambiarEstado(id, body.get("estado"))));
    }
}
