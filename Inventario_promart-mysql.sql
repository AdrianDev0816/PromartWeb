-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema db_inventario_promart
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema db_inventario_promart
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `db_inventario_promart` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `db_inventario_promart` ;

-- -----------------------------------------------------
-- Table `db_inventario_promart`.`rol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`rol` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(150) NULL DEFAULT NULL,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`trabajador`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`trabajador` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cargo` ENUM('Supervisor', 'Almacenero', 'Administrador') NULL DEFAULT NULL,
  `clave` VARCHAR(255) NULL DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NULL DEFAULT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NULL DEFAULT NULL,
  `id_rol` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UK_a4nvdrrwr139rgydtp5877c5c` (`usuario` ASC) VISIBLE,
  INDEX `FKtl4wg29h2rrlrcflja0tv6yuy` (`id_rol` ASC) VISIBLE,
  CONSTRAINT `FKtl4wg29h2rrlrcflja0tv6yuy`
    FOREIGN KEY (`id_rol`)
    REFERENCES `db_inventario_promart`.`rol` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`proveedor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`proveedor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `contacto` VARCHAR(100) NULL DEFAULT NULL,
  `correo` VARCHAR(100) NULL DEFAULT NULL,
  `direccion` VARCHAR(150) NULL DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NULL DEFAULT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `ruc` VARCHAR(20) NULL DEFAULT NULL,
  `telefono` VARCHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`producto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `categoria` VARCHAR(50) NULL DEFAULT NULL,
  `codigo_serie` VARCHAR(50) NOT NULL,
  `estado` ENUM('Activo', 'Inactivo') NULL DEFAULT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock_actual` INT NOT NULL,
  `stock_minimo` INT NOT NULL,
  `id_proveedor` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UK_dydl8awa8ft2pdubgf8ua9v3k` (`codigo_serie` ASC) VISIBLE,
  INDEX `FKkinjnx6sxv6kf9s6i21ttfnfo` (`id_proveedor` ASC) VISIBLE,
  CONSTRAINT `FKkinjnx6sxv6kf9s6i21ttfnfo`
    FOREIGN KEY (`id_proveedor`)
    REFERENCES `db_inventario_promart`.`proveedor` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`alerta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`alerta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATETIME(6) NOT NULL,
  `fecha_resolucion` DATETIME(6) NULL DEFAULT NULL,
  `leida` BIT(1) NOT NULL,
  `resuelta` BIT(1) NOT NULL,
  `stock_actual` INT NOT NULL,
  `stock_minimo` INT NOT NULL,
  `tipo` ENUM('STOCK_CRITICO', 'STOCK_MINIMO', 'SIN_MOVIMIENTO') NOT NULL,
  `id_producto` INT NOT NULL,
  `id_trabajador` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKrh7rd3yr22tc41k3761281oh5` (`id_producto` ASC) VISIBLE,
  INDEX `FKg8hjcrdhscm1pmhrpadk6v0fo` (`id_trabajador` ASC) VISIBLE,
  CONSTRAINT `FKg8hjcrdhscm1pmhrpadk6v0fo`
    FOREIGN KEY (`id_trabajador`)
    REFERENCES `db_inventario_promart`.`trabajador` (`id`),
  CONSTRAINT `FKrh7rd3yr22tc41k3761281oh5`
    FOREIGN KEY (`id_producto`)
    REFERENCES `db_inventario_promart`.`producto` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`movimientoinventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`movimientoinventario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cantidad` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `motivo` ENUM('Venta', 'Merma', 'Entrada', 'Salida', 'Devolucion', 'Transferencia', 'Ajuste') NULL DEFAULT NULL,
  `observaciones` VARCHAR(255) NULL DEFAULT NULL,
  `tipo` ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
  `id_producto` INT NOT NULL,
  `id_trabajador` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKmv1h8on4yxe6jbnvf9ndxdh9b` (`id_producto` ASC) VISIBLE,
  INDEX `FK6gg9fmvs40v8a0jvxobuyha8w` (`id_trabajador` ASC) VISIBLE,
  CONSTRAINT `FK6gg9fmvs40v8a0jvxobuyha8w`
    FOREIGN KEY (`id_trabajador`)
    REFERENCES `db_inventario_promart`.`trabajador` (`id`),
  CONSTRAINT `FKmv1h8on4yxe6jbnvf9ndxdh9b`
    FOREIGN KEY (`id_producto`)
    REFERENCES `db_inventario_promart`.`producto` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`orden_compra`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`orden_compra` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estado` ENUM('Pendiente', 'Aprobada', 'Rechazada', 'EnProceso', 'Completada', 'Cancelada') NULL DEFAULT NULL,
  `fecha_completado` DATETIME(6) NULL DEFAULT NULL,
  `fecha_emision` DATE NOT NULL,
  `fecha_estimada_entrega` DATE NULL DEFAULT NULL,
  `fecha_evaluacion` DATETIME(6) NULL DEFAULT NULL,
  `motivo_rechazo` TEXT NULL DEFAULT NULL,
  `numero_orden` VARCHAR(20) NOT NULL,
  `observaciones` TEXT NULL DEFAULT NULL,
  `total` DECIMAL(12,2) NULL DEFAULT NULL,
  `id_evaluador` INT NULL DEFAULT NULL,
  `id_proveedor` INT NOT NULL,
  `id_trabajador` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UK_n3wdkpsktox5nsuni10s47cc8` (`numero_orden` ASC) VISIBLE,
  INDEX `FKj6x3burlhhcnaceim0go0chxy` (`id_evaluador` ASC) VISIBLE,
  INDEX `FKpgp1ooe3wmycq29kdj6qydybp` (`id_proveedor` ASC) VISIBLE,
  INDEX `FKaydj9hke38gu3toskpfl5bu90` (`id_trabajador` ASC) VISIBLE,
  CONSTRAINT `FKaydj9hke38gu3toskpfl5bu90`
    FOREIGN KEY (`id_trabajador`)
    REFERENCES `db_inventario_promart`.`trabajador` (`id`),
  CONSTRAINT `FKj6x3burlhhcnaceim0go0chxy`
    FOREIGN KEY (`id_evaluador`)
    REFERENCES `db_inventario_promart`.`trabajador` (`id`),
  CONSTRAINT `FKpgp1ooe3wmycq29kdj6qydybp`
    FOREIGN KEY (`id_proveedor`)
    REFERENCES `db_inventario_promart`.`proveedor` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `db_inventario_promart`.`orden_compra_detalle`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `db_inventario_promart`.`orden_compra_detalle` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `id_orden_compra` INT NOT NULL,
  `id_producto` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKe21nr5owb360rvk64ofobwusi` (`id_orden_compra` ASC) VISIBLE,
  INDEX `FKrxn0xhknod5tmc1dtjad63993` (`id_producto` ASC) VISIBLE,
  CONSTRAINT `FKe21nr5owb360rvk64ofobwusi`
    FOREIGN KEY (`id_orden_compra`)
    REFERENCES `db_inventario_promart`.`orden_compra` (`id`),
  CONSTRAINT `FKrxn0xhknod5tmc1dtjad63993`
    FOREIGN KEY (`id_producto`)
    REFERENCES `db_inventario_promart`.`producto` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
