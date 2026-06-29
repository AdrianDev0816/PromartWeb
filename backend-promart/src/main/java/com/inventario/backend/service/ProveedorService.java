package com.inventario.backend.service;

import com.inventario.backend.dto.ProveedorDto;
import com.inventario.backend.dto.ProveedorRequestDto;
import com.inventario.backend.entity.Proveedor;
import com.inventario.backend.repository.ProductoRepository;
import com.inventario.backend.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<ProveedorDto> listar() {
        return proveedorRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProveedorDto buscarPorId(Integer id) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return toDto(p);
    }

    @Transactional
    public ProveedorDto registrar(ProveedorRequestDto request) {
        if (request.getRuc() != null && !request.getRuc().isBlank()) {
            proveedorRepository.findByRuc(request.getRuc()).ifPresent(existing -> {
                throw new RuntimeException("Ya existe un proveedor con ese RUC");
            });
        }
        Proveedor p = Proveedor.builder()
                .nombre(request.getNombre())
                .ruc(request.getRuc())
                .contacto(request.getContacto())
                .telefono(request.getTelefono())
                .correo(request.getCorreo())
                .direccion(request.getDireccion())
                .estado(request.getEstado() != null
                        ? Proveedor.Estado.valueOf(request.getEstado())
                        : Proveedor.Estado.Activo)
                .build();
        return toDto(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorDto editar(Integer id, ProveedorRequestDto request) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        if (request.getRuc() != null && !request.getRuc().isBlank()) {
            proveedorRepository.findByRuc(request.getRuc()).ifPresent(otro -> {
                if (!otro.getId().equals(id))
                    throw new RuntimeException("El RUC ya está registrado por otro proveedor");
            });
        }

        p.setNombre(request.getNombre());
        p.setRuc(request.getRuc());
        p.setContacto(request.getContacto());
        p.setTelefono(request.getTelefono());
        p.setCorreo(request.getCorreo());
        p.setDireccion(request.getDireccion());
        if (request.getEstado() != null) {
            p.setEstado(Proveedor.Estado.valueOf(request.getEstado()));
        }
        return toDto(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorDto cambiarEstado(Integer id, String estado) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        p.setEstado(Proveedor.Estado.valueOf(estado));
        return toDto(proveedorRepository.save(p));
    }

    private ProveedorDto toDto(Proveedor p) {
        Long cantidad = productoRepository.countByProveedorId(p.getId());
        return ProveedorDto.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .ruc(p.getRuc())
                .contacto(p.getContacto())
                .telefono(p.getTelefono())
                .correo(p.getCorreo())
                .direccion(p.getDireccion())
                .estado(p.getEstado() != null ? p.getEstado().name() : "Activo")
                .cantidadProductos(cantidad != null ? cantidad : 0L)
                .build();
    }
}
