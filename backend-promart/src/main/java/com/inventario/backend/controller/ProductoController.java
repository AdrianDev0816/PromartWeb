package com.inventario.backend.controller;

import com.inventario.backend.dto.ProductoDto;
import com.inventario.backend.dto.ProductoRequestDto;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<List<ProductoDto>>> listarProductos() {
        return ResponseEntity.ok(ApiResponse.ok("Productos obtenidos correctamente",
                productoService.listarProductos()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<ProductoDto>> buscarProducto(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok("Producto encontrado", productoService.buscarPorId(id)));
    }

    @GetMapping("/bajo-stock")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<List<ProductoDto>>> listarBajoStock() {
        return ResponseEntity.ok(ApiResponse.ok("Productos con bajo stock", productoService.listarBajoStock()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','ALMACENERO')")
    public ResponseEntity<ApiResponse<ProductoDto>> registrarProducto(
            @Valid @RequestBody ProductoRequestDto request) {
        ProductoDto producto = productoService.registrarProducto(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Producto registrado correctamente", producto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProductoDto>> editarProducto(
            @PathVariable Integer id,
            @Valid @RequestBody ProductoRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Producto actualizado correctamente",
                productoService.editarProducto(id, request)));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<ProductoDto>> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Estado actualizado correctamente",
                productoService.cambiarEstado(id, body.get("estado"))));
    }

    @PatchMapping("/{id}/stock-minimo")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProductoDto>> actualizarStockMinimo(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(ApiResponse.ok("Stock mínimo actualizado correctamente",
                productoService.actualizarStockMinimo(id, body.get("stockMinimo"))));
    }
}
