package com.inventario.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {
    private Integer id;
    private String nombre;
    private String cargo;
    private String usuario;
    private String iniciales;
    private String token;
    private Long expiresIn;
}
