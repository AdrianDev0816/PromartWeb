package com.inventario.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerta")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idProducto", nullable = false)
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tipo tipo;

    @Column(nullable = false)
    private Integer stockActual;

    @Column(nullable = false)
    private Integer stockMinimo;

    @Builder.Default
    @Column(nullable = false)
    private boolean leida = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean resuelta = false;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idTrabajador")
    private Trabajador trabajador;

    private LocalDateTime fechaResolucion;

    public enum Tipo {
        STOCK_CRITICO,
        STOCK_MINIMO,
        SIN_MOVIMIENTO
    }
}
