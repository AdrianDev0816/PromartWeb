package com.inventario.backend.repository;

import com.inventario.backend.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovimientoInventarioRepository
        extends JpaRepository<MovimientoInventario, Integer> {

    @Query("SELECT m FROM MovimientoInventario m LEFT JOIN FETCH m.producto LEFT JOIN FETCH m.trabajador WHERE m.producto.id = :productoId")
    List<MovimientoInventario> findByProductoId(@Param("productoId") Integer productoId);

    @Query("SELECT m FROM MovimientoInventario m LEFT JOIN FETCH m.producto LEFT JOIN FETCH m.trabajador WHERE m.tipo = :tipo")
    List<MovimientoInventario> findByTipo(@Param("tipo") MovimientoInventario.Tipo tipo);

    @Query("SELECT m FROM MovimientoInventario m LEFT JOIN FETCH m.producto LEFT JOIN FETCH m.trabajador")
    List<MovimientoInventario> findAllConRelaciones();

    @Query("SELECT m FROM MovimientoInventario m LEFT JOIN FETCH m.producto LEFT JOIN FETCH m.trabajador " +
            "WHERE (:motivo IS NULL OR m.motivo = :motivo) " +
            "AND (:desde IS NULL OR m.fecha >= :desde) " +
            "AND (:hasta IS NULL OR m.fecha <= :hasta)")
    List<MovimientoInventario> filtrarMovimientos(
            @Param("motivo") MovimientoInventario.Motivo motivo,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta
    );
}