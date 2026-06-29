package com.inventario.backend.repository;

import com.inventario.backend.entity.OrdenCompraDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrdenCompraDetalleRepository extends JpaRepository<OrdenCompraDetalle, Integer> {

    @Query("SELECT d FROM OrdenCompraDetalle d " +
           "LEFT JOIN FETCH d.producto " +
           "WHERE d.ordenCompra.id = :ordenId")
    List<OrdenCompraDetalle> findByOrdenCompraId(@Param("ordenId") Integer ordenId);
}
