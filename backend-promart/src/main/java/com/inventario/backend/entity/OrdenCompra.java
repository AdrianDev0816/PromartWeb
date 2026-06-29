package com.inventario.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orden_compra")
public class OrdenCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 20)
    private String numeroOrden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idProveedor", nullable = false)
    private Proveedor proveedor;

    @Column(nullable = false)
    private LocalDate fechaEmision;

    private LocalDate fechaEstimadaEntrega;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Pendiente','Aprobada','Rechazada','EnProceso','Completada','Cancelada')")
    private Estado estado = Estado.Pendiente;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idTrabajador", nullable = false)
    private Trabajador trabajador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idEvaluador")
    private Trabajador evaluador;

    private LocalDateTime fechaEvaluacion;

    @Column(columnDefinition = "TEXT")
    private String motivoRechazo;

    private LocalDateTime fechaCompletado;

    public enum Estado { Pendiente, Aprobada, Rechazada, EnProceso, Completada, Cancelada }
}
