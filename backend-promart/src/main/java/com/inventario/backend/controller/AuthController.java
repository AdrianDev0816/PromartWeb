package com.inventario.backend.controller;

import com.inventario.backend.dto.LoginRequestDto;
import com.inventario.backend.dto.LoginResponseDto;
import com.inventario.backend.entity.Trabajador;
import com.inventario.backend.repository.TrabajadorRepository;
import com.inventario.backend.response.ApiResponse;
import com.inventario.backend.security.JwtTokenProvider;
import com.inventario.backend.service.TrabajadorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TrabajadorRepository trabajadorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@RequestBody LoginRequestDto request) {
        Optional<Trabajador> opt = trabajadorRepository.findByUsuario(request.getUsuario());

        if (opt.isEmpty() || !passwordEncoder.matches(request.getClave(), opt.get().getClave())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Usuario o contraseña incorrectos"));
        }

        Trabajador t = opt.get();

        if (t.getEstado() == Trabajador.Estado.Inactivo) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Tu cuenta está inactiva. Contacta al administrador."));
        }

        String token = jwtTokenProvider.generateToken(t.getUsuario());

        LoginResponseDto response = LoginResponseDto.builder()
                .id(t.getId())
                .nombre(t.getNombre())
                .cargo(t.getCargo() != null ? t.getCargo().name() : "")
                .usuario(t.getUsuario())
                .iniciales(TrabajadorService.getIniciales(t.getNombre()))
                .token(token)
                .expiresIn(jwtTokenProvider.getExpiration())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Bienvenido, " + t.getNombre(), response));
    }
}
