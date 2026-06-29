package com.inventario.backend.security;

import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.TrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final TrabajadorRepository trabajadorRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Trabajador t = trabajadorRepository.findByUsuario(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        if (t.getEstado() == Trabajador.Estado.Inactivo) {
            throw new UsernameNotFoundException("Cuenta inactiva: " + username);
        }

        String role = "ROLE_" + (t.getCargo() != null
                ? t.getCargo().name().toUpperCase()
                : "ALMACENERO");

        return User.builder()
                .username(t.getUsuario())
                .password(t.getClave())
                .authorities(List.of(new SimpleGrantedAuthority(role)))
                .build();
    }
}
