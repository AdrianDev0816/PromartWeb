package com.inventario.backend.security;

import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.TrabajadorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2)
public class PasswordMigrationRunner implements ApplicationRunner {

    private final TrabajadorRepository trabajadorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Trabajador> trabajadores = trabajadorRepository.findAll();
        int migrados = 0;

        for (Trabajador t : trabajadores) {
            if (t.getClave() != null && !t.getClave().startsWith("$2")) {
                t.setClave(passwordEncoder.encode(t.getClave()));
                trabajadorRepository.save(t);
                migrados++;
            }
        }

        if (migrados > 0) {
            log.info("✅ Migración BCrypt: {} contraseña(s) hasheada(s) correctamente.", migrados);
        }
    }
}
