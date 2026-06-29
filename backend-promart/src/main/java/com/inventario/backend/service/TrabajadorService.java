package com.inventario.backend.service;

import com.inventario.backend.dto.TrabajadorDto;
import com.inventario.backend.dto.TrabajadorRequestDto;
import com.inventario.backend.entity.Rol;
import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.RolRepository;
import com.inventario.backend.repository.TrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrabajadorService {

    private final TrabajadorRepository trabajadorRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<TrabajadorDto> listar() {
        return trabajadorRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TrabajadorDto registrar(TrabajadorRequestDto request) {
        if (trabajadorRepository.findByUsuario(request.getUsuario()).isPresent()) {
            throw new RuntimeException("Ya existe un trabajador con ese usuario");
        }

        Rol rol = rolRepository.findByNombre(request.getCargo()).orElse(null);

        Trabajador t = Trabajador.builder()
                .nombre(request.getNombre())
                .cargo(Trabajador.Cargo.valueOf(request.getCargo()))
                .usuario(request.getUsuario())
                .clave(passwordEncoder.encode(request.getClave()))
                .estado(request.getEstado() != null
                        ? Trabajador.Estado.valueOf(request.getEstado())
                        : Trabajador.Estado.Activo)
                .rol(rol)
                .build();

        return toDto(trabajadorRepository.save(t));
    }

    @Transactional
    public TrabajadorDto editar(Integer id, TrabajadorRequestDto request) {
        Trabajador t = trabajadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trabajador no encontrado"));

        trabajadorRepository.findByUsuario(request.getUsuario())
                .ifPresent(otro -> {
                    if (!otro.getId().equals(id))
                        throw new RuntimeException("El usuario ya está en uso por otro trabajador");
                });

        Rol rol = rolRepository.findByNombre(request.getCargo()).orElse(null);

        t.setNombre(request.getNombre());
        t.setCargo(Trabajador.Cargo.valueOf(request.getCargo()));
        t.setUsuario(request.getUsuario());
        t.setRol(rol);

        if (request.getClave() != null && !request.getClave().isBlank()) {
            t.setClave(passwordEncoder.encode(request.getClave()));
        }
        if (request.getEstado() != null) {
            t.setEstado(Trabajador.Estado.valueOf(request.getEstado()));
        }

        return toDto(trabajadorRepository.save(t));
    }

    @Transactional
    public TrabajadorDto cambiarEstado(Integer id, String estado) {
        Trabajador t = trabajadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trabajador no encontrado"));
        t.setEstado(Trabajador.Estado.valueOf(estado));
        return toDto(trabajadorRepository.save(t));
    }

    private TrabajadorDto toDto(Trabajador t) {
        String email = t.getUsuario() != null ? t.getUsuario() + "@promart.pe" : "";
        return TrabajadorDto.builder()
                .id(t.getId())
                .nombre(t.getNombre())
                .cargo(t.getCargo() != null ? t.getCargo().name() : null)
                .usuario(t.getUsuario())
                .email(email)
                .estado(t.getEstado() != null ? t.getEstado().name() : "Activo")
                .rolNombre(t.getRol() != null ? t.getRol().getNombre() : null)
                .iniciales(getIniciales(t.getNombre()))
                .build();
    }

    public static String getIniciales(String nombre) {
        if (nombre == null || nombre.isBlank()) return "?";
        String[] partes = nombre.trim().split("\\s+");
        if (partes.length >= 2)
            return (String.valueOf(partes[0].charAt(0)) + partes[1].charAt(0)).toUpperCase();
        return nombre.substring(0, Math.min(2, nombre.length())).toUpperCase();
    }
}
