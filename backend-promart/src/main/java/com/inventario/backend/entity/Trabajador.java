package com.inventario.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "trabajador")
public class Trabajador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Supervisor','Almacenero','Administrador')")
    private Cargo cargo;

    @Column(unique = true, length = 50)
    private String usuario;

    @Column(length = 255)
    private String clave;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Activo','Inactivo')")
    private Estado estado = Estado.Activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idRol")
    private Rol rol;

    public enum Cargo { Supervisor, Almacenero, Administrador }
    public enum Estado { Activo, Inactivo }
}




