package com.inventario.backend.service;

import com.inventario.backend.dto.ProductoDto;
import com.inventario.backend.dto.ProductoRequestDto;
import com.inventario.backend.entity.Producto;
import com.inventario.backend.entity.Proveedor;
import com.inventario.backend.repository.ProductoRepository;
import com.inventario.backend.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {
    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final WebSocketNotificacionService wsNotificacionService;
    private final AlertaService alertaService;


    // Lista todos los productos activos
    public List<ProductoDto> listarProductos() {
        return productoRepository.findByEstado(Producto.Estado.Activo)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Busca un producto por id
    public ProductoDto buscarPorId(Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return toDTO(producto);
    }

    // Productos bajo stock mínimo
    public List<ProductoDto> listarBajoStock() {
        return productoRepository.findProductosBajoStock()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Convierte entidad a Dto
    private ProductoDto toDTO(Producto p) {
        return new ProductoDto(
                p.getId(),
                p.getCodigoSerie(),
                p.getNombre(),
                p.getCategoria(),
                p.getStockActual(),
                p.getStockMinimo(),
                p.getPrecio(),
                p.getEstado().name(),
                p.getProveedor() != null ? p.getProveedor().getNombre() : null,
                p.getProveedor() != null ? p.getProveedor().getId() : null
        );
    }

    // Registrar nuevo producto
    public ProductoDto registrarProducto(ProductoRequestDto request) {
        if (productoRepository.yaExisteCodigoSerie(request.getCodigoSerie())) {
            throw new RuntimeException("Ya existe un producto con ese código de serie");
        }

        Proveedor proveedor = null;
        if (request.getIdProveedor() != null) {
            proveedor = proveedorRepository.findById(request.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        Producto producto = Producto.builder()
                .codigoSerie(request.getCodigoSerie())
                .nombre(request.getNombre())
                .categoria(request.getCategoria())
                .stockActual(0)
                .stockMinimo(request.getStockMinimo())
                .precio(request.getPrecio())
                .estado(Producto.Estado.Activo)
                .proveedor(proveedor)
                .build();

        Producto saved = productoRepository.save(producto);
        alertaService.procesarAlertaStockBajo(saved, null);
        ProductoDto dto = toDTO(saved);
        wsNotificacionService.notificarProducto("Nuevo producto", dto.getNombre());
        return dto;
    }

    // Editar producto existente
    public ProductoDto editarProducto(Integer id, ProductoRequestDto request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        boolean codigoOcupado = productoRepository.otroProductoTieneElCodigoSerie(
                request.getCodigoSerie(), id);
        if (codigoOcupado) {
            throw new RuntimeException("Ya existe otro producto con ese código de serie");
        }

        Proveedor proveedor = null;
        if (request.getIdProveedor() != null) {
            proveedor = proveedorRepository.findById(request.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        producto.setCodigoSerie(request.getCodigoSerie());
        producto.setNombre(request.getNombre());
        producto.setCategoria(request.getCategoria());
        producto.setStockMinimo(request.getStockMinimo());
        producto.setPrecio(request.getPrecio());
        producto.setProveedor(proveedor);

        Producto saved = productoRepository.save(producto);
        alertaService.procesarAlertaStockBajo(saved, null);
        ProductoDto dto = toDTO(saved);
        wsNotificacionService.notificarProducto("Producto editado", dto.getNombre());
        return dto;
    }

    // Activar o desactivar producto
    public ProductoDto cambiarEstado(Integer id, String estado) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setEstado(Producto.Estado.valueOf(estado));
        ProductoDto dto = toDTO(productoRepository.save(producto));
        wsNotificacionService.notificarProducto("Estado actualizado", dto.getNombre());
        return dto;
    }

    // Actualizar solo el stock mínimo
    public ProductoDto actualizarStockMinimo(Integer id, Integer nuevoStockMinimo) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (nuevoStockMinimo < 0) {
            throw new RuntimeException("El stock mínimo no puede ser negativo");
        }

        producto.setStockMinimo(nuevoStockMinimo);
        Producto saved = productoRepository.save(producto);
        alertaService.procesarAlertaStockBajo(saved, null);
        return toDTO(saved);
    }


}
