package com.inventario.backend.repository;

import com.inventario.backend.entity.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Integer> {

    @Query("SELECT a FROM Alerta a " +
           "JOIN FETCH a.producto " +
           "LEFT JOIN FETCH a.trabajador " +
           "WHERE a.resuelta = false " +
           "ORDER BY a.leida ASC, a.fecha DESC")
    List<Alerta> findActivas();

    @Query("SELECT a FROM Alerta a " +
           "JOIN FETCH a.producto " +
           "LEFT JOIN FETCH a.trabajador " +
           "WHERE (:tipo IS NULL OR a.tipo = :tipo) " +
           "AND (:leida IS NULL OR a.leida = :leida) " +
           "AND (:resuelta IS NULL OR a.resuelta = :resuelta) " +
           "AND (:desde IS NULL OR a.fecha >= :desde) " +
           "AND (:hasta IS NULL OR a.fecha <= :hasta) " +
           "ORDER BY a.fecha DESC")
    List<Alerta> findConFiltros(
            @Param("tipo")     Alerta.Tipo tipo,
            @Param("leida")    Boolean leida,
            @Param("resuelta") Boolean resuelta,
            @Param("desde")    LocalDateTime desde,
            @Param("hasta")    LocalDateTime hasta
    );

    @Query("SELECT a FROM Alerta a " +
           "WHERE a.producto.id = :productoId " +
           "AND a.resuelta = false")
    List<Alerta> findActivasPorProducto(@Param("productoId") Integer productoId);

    @Query("SELECT COUNT(a) FROM Alerta a WHERE a.resuelta = false AND a.leida = false")
    long countNoLeidas();
}
