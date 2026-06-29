package com.inventario.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "movimientoinventario")
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false,
            columnDefinition = "ENUM('Entrada','Salida','Ajuste')")
    private Tipo tipo;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Venta','Merma','Entrada','Salida','Devolucion','Transferencia','Ajuste')")
    private Motivo motivo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(length = 255)
    private String observaciones;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idProducto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idTrabajador")
    private Trabajador trabajador;

    public enum Tipo { Entrada, Salida, Ajuste }
    public enum Motivo { Venta, Merma, Entrada, Salida, Devolucion, Transferencia, Ajuste }

}

