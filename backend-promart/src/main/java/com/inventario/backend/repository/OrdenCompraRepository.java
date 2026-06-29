package com.inventario.backend.repository;

import com.inventario.backend.entity.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Integer> {

    @Query("SELECT o FROM OrdenCompra o " +
           "LEFT JOIN FETCH o.proveedor " +
           "LEFT JOIN FETCH o.trabajador " +
           "LEFT JOIN FETCH o.evaluador " +
           "ORDER BY o.fechaEmision DESC, o.id DESC")
    List<OrdenCompra> findAllConRelaciones();

    @Query("SELECT o FROM OrdenCompra o " +
           "LEFT JOIN FETCH o.proveedor " +
           "LEFT JOIN FETCH o.trabajador " +
           "LEFT JOIN FETCH o.evaluador " +
           "WHERE o.id = :id")
    Optional<OrdenCompra> findByIdConRelaciones(Integer id);

    @Query("SELECT o FROM OrdenCompra o " +
           "LEFT JOIN FETCH o.proveedor " +
           "LEFT JOIN FETCH o.trabajador " +
           "LEFT JOIN FETCH o.evaluador " +
           "WHERE o.trabajador.id = :trabajadorId " +
           "ORDER BY o.fechaEmision DESC, o.id DESC")
    List<OrdenCompra> findByTrabajadorIdConRelaciones(@Param("trabajadorId") Integer trabajadorId);

    long countByEstado(OrdenCompra.Estado estado);
}
