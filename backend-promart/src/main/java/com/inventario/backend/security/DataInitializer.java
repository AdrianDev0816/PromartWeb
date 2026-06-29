package com.inventario.backend.security;

import com.inventario.backend.entity.Rol;
import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.RolRepository;
import com.inventario.backend.repository.TrabajadorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
public class DataInitializer implements ApplicationRunner {

    private final RolRepository       rolRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final PasswordEncoder      passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        crearRoles();
        crearAdminPorDefecto();
    }

    private void crearRoles() {
        crearRolSiNoExiste("Administrador", "Acceso total al sistema");
        crearRolSiNoExiste("Supervisor",    "Gestión de inventario y reportes");
        crearRolSiNoExiste("Almacenero",    "Registro de movimientos de stock");
    }

    private void crearRolSiNoExiste(String nombre, String descripcion) {
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            Rol rol = Rol.builder()
                    .nombre(nombre)
                    .descripcion(descripcion)
                    .build();
            rolRepository.save(rol);
            log.info("Rol creado: {}", nombre);
        }
    }

    private void crearAdminPorDefecto() {
        if (trabajadorRepository.findByUsuario("Jhanns").isPresent()) return;

        Rol rolAdmin = rolRepository.findByNombre("Administrador").orElse(null);

        Trabajador admin = Trabajador.builder()
                .nombre("Jhanns")
                .usuario("Jhanns")
                .clave(passwordEncoder.encode("12345678"))
                .cargo(Trabajador.Cargo.Administrador)
                .estado(Trabajador.Estado.Activo)
                .rol(rolAdmin)
                .build();

        trabajadorRepository.save(admin);
        log.info("Usuario administrador creado → usuario: Jhanns");
    }
}
