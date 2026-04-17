CREATE DATABASE IF NOT EXISTS kwl_lavanderia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kwl_lavanderia;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS configuracion;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS log_maquina;
DROP TABLE IF EXISTS movimiento_maquina;
DROP TABLE IF EXISTS ciclo;
DROP TABLE IF EXISTS tarifa_maquina;
DROP TABLE IF EXISTS maquina;
DROP TABLE IF EXISTS usuario_lavanderia;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS lavanderia;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE lavanderia (
    id_lavanderia BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    direccion VARCHAR(255) NULL,
    ciudad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_lavanderia_codigo UNIQUE (codigo),
    INDEX idx_lavanderia_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario (
    id_usuario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellidos VARCHAR(120) NULL,
    login VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_login UNIQUE (login),
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario_lavanderia (
    id_usuario_lavanderia BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT UNSIGNED NOT NULL,
    id_lavanderia BIGINT UNSIGNED NOT NULL,
    fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_lavanderia UNIQUE (id_usuario, id_lavanderia),
    CONSTRAINT fk_usuario_lavanderia_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usuario_lavanderia_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_usuario_lavanderia_lavanderia (id_lavanderia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE maquina (
    id_maquina BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lavanderia BIGINT UNSIGNED NOT NULL,
    codigo_visible VARCHAR(20) NOT NULL,
    tipo_maquina VARCHAR(20) NOT NULL,
    estado_actual VARCHAR(30) NOT NULL DEFAULT 'STOP',
    activa TINYINT(1) NOT NULL DEFAULT 1,
    fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_maquina_codigo_por_lavanderia UNIQUE (id_lavanderia, codigo_visible),
    CONSTRAINT fk_maquina_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_maquina_lavanderia_tipo (id_lavanderia, tipo_maquina),
    INDEX idx_maquina_lavanderia_estado (id_lavanderia, estado_actual),
    INDEX idx_maquina_activa (activa),
    CONSTRAINT chk_maquina_tipo
        CHECK (tipo_maquina IN ('LAVADORA', 'SECADORA')),
    CONSTRAINT chk_maquina_estado
        CHECK (estado_actual IN ('STOP', 'EN_MARCHA', 'PAUSADA', 'FUERA_SERVICIO', 'MANTENIMIENTO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tarifa_maquina (
    id_tarifa BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lavanderia BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio_arranque DECIMAL(10,2) NOT NULL,
    tiempo_base_minutos SMALLINT UNSIGNED NOT NULL,
    importe_incremento DECIMAL(10,2) NOT NULL,
    minutos_por_incremento SMALLINT UNSIGNED NOT NULL,
    fecha_inicio_vigencia DATETIME NOT NULL,
    fecha_fin_vigencia DATETIME NULL,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tarifa_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_tarifa_lavanderia_activa (id_lavanderia, activa),
    INDEX idx_tarifa_lavanderia_inicio (id_lavanderia, fecha_inicio_vigencia),
    INDEX idx_tarifa_lavanderia_fin (id_lavanderia, fecha_fin_vigencia),
    CONSTRAINT chk_tarifa_precio_arranque CHECK (precio_arranque >= 0),
    CONSTRAINT chk_tarifa_tiempo_base CHECK (tiempo_base_minutos > 0),
    CONSTRAINT chk_tarifa_importe_incremento CHECK (importe_incremento > 0),
    CONSTRAINT chk_tarifa_minutos_incremento CHECK (minutos_por_incremento > 0),
    CONSTRAINT chk_tarifa_vigencia CHECK (fecha_fin_vigencia IS NULL OR fecha_fin_vigencia > fecha_inicio_vigencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ciclo (
    id_ciclo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_maquina BIGINT UNSIGNED NOT NULL,
    id_tarifa_aplicada BIGINT UNSIGNED NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NULL,
    estado_ciclo VARCHAR(30) NOT NULL DEFAULT 'INICIADO',
    precio_arranque_aplicado DECIMAL(10,2) NOT NULL,
    tiempo_base_aplicado_min SMALLINT UNSIGNED NOT NULL,
    minutos_extra_total SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    importe_cliente_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    importe_bonificado_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    importe_total_aplicado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duracion_total_programada_min SMALLINT UNSIGNED NOT NULL,
    observaciones TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ciclo_maquina
        FOREIGN KEY (id_maquina) REFERENCES maquina(id_maquina)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ciclo_tarifa
        FOREIGN KEY (id_tarifa_aplicada) REFERENCES tarifa_maquina(id_tarifa)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_ciclo_maquina_inicio (id_maquina, fecha_hora_inicio),
    INDEX idx_ciclo_maquina_estado (id_maquina, estado_ciclo),
    INDEX idx_ciclo_tarifa (id_tarifa_aplicada),
    INDEX idx_ciclo_inicio (fecha_hora_inicio),
    INDEX idx_ciclo_fin (fecha_hora_fin),
    CONSTRAINT chk_ciclo_estado CHECK (estado_ciclo IN ('INICIADO', 'FINALIZADO', 'CANCELADO', 'INCIDENCIA')),
    CONSTRAINT chk_ciclo_precio_arranque CHECK (precio_arranque_aplicado >= 0),
    CONSTRAINT chk_ciclo_tiempo_base CHECK (tiempo_base_aplicado_min > 0),
    CONSTRAINT chk_ciclo_minutos_extra CHECK (minutos_extra_total >= 0),
    CONSTRAINT chk_ciclo_importe_cliente CHECK (importe_cliente_total >= 0),
    CONSTRAINT chk_ciclo_importe_bonificado CHECK (importe_bonificado_total >= 0),
    CONSTRAINT chk_ciclo_importe_total CHECK (importe_total_aplicado >= 0),
    CONSTRAINT chk_ciclo_duracion_total CHECK (duracion_total_programada_min > 0),
    CONSTRAINT chk_ciclo_fin_mayor_inicio CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimiento_maquina (
    id_movimiento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lavanderia BIGINT UNSIGNED NOT NULL,
    id_maquina BIGINT UNSIGNED NOT NULL,
    id_ciclo BIGINT UNSIGNED NULL,
    id_usuario BIGINT UNSIGNED NULL,
    fecha_hora DATETIME NOT NULL,
    tipo_movimiento VARCHAR(30) NOT NULL,
    origen_movimiento VARCHAR(30) NOT NULL,
    importe DECIMAL(10,2) NOT NULL,
    minutos_extra_generados SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    es_bonificacion TINYINT(1) NOT NULL DEFAULT 0,
    descripcion VARCHAR(255) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_maquina
        FOREIGN KEY (id_maquina) REFERENCES maquina(id_maquina)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_ciclo
        FOREIGN KEY (id_ciclo) REFERENCES ciclo(id_ciclo)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_movimiento_lavanderia_fecha (id_lavanderia, fecha_hora),
    INDEX idx_movimiento_maquina_fecha (id_maquina, fecha_hora),
    INDEX idx_movimiento_ciclo_fecha (id_ciclo, fecha_hora),
    INDEX idx_movimiento_usuario_fecha (id_usuario, fecha_hora),
    INDEX idx_movimiento_tipo (tipo_movimiento),
    INDEX idx_movimiento_origen (origen_movimiento),
    INDEX idx_movimiento_bonificacion (es_bonificacion),
    CONSTRAINT chk_movimiento_tipo CHECK (tipo_movimiento IN ('ARRANQUE', 'AMPLIACION_TIEMPO')),
    CONSTRAINT chk_movimiento_origen CHECK (origen_movimiento IN ('MONEDERO', 'WEB_MANUAL')),
    CONSTRAINT chk_movimiento_importe CHECK (importe > 0),
    CONSTRAINT chk_movimiento_minutos_extra CHECK (minutos_extra_generados >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE log_maquina (
    id_log BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lavanderia BIGINT UNSIGNED NOT NULL,
    id_maquina BIGINT UNSIGNED NOT NULL,
    id_ciclo BIGINT UNSIGNED NULL,
    fecha_hora DATETIME NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) NOT NULL DEFAULT 'INFO',
    payload JSON NULL,
    procesado TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_log_maquina
        FOREIGN KEY (id_maquina) REFERENCES maquina(id_maquina)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_log_ciclo
        FOREIGN KEY (id_ciclo) REFERENCES ciclo(id_ciclo)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_log_lavanderia_fecha (id_lavanderia, fecha_hora),
    INDEX idx_log_maquina_fecha (id_maquina, fecha_hora),
    INDEX idx_log_ciclo_fecha (id_ciclo, fecha_hora),
    INDEX idx_log_tipo_evento (tipo_evento),
    INDEX idx_log_nivel (nivel),
    INDEX idx_log_procesado (procesado),
    CONSTRAINT chk_log_nivel CHECK (nivel IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT chk_log_payload_json CHECK (payload IS NULL OR JSON_VALID(payload))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria (
    id_auditoria BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT UNSIGNED NOT NULL,
    id_lavanderia BIGINT UNSIGNED NULL,
    id_maquina BIGINT UNSIGNED NULL,
    id_ciclo BIGINT UNSIGNED NULL,
    fecha_hora DATETIME NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_afectada VARCHAR(50) NOT NULL,
    id_entidad_afectada BIGINT UNSIGNED NULL,
    detalle TEXT NULL,
    ip_origen VARCHAR(45) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_auditoria_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_auditoria_maquina
        FOREIGN KEY (id_maquina) REFERENCES maquina(id_maquina)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_auditoria_ciclo
        FOREIGN KEY (id_ciclo) REFERENCES ciclo(id_ciclo)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_auditoria_usuario_fecha (id_usuario, fecha_hora),
    INDEX idx_auditoria_lavanderia_fecha (id_lavanderia, fecha_hora),
    INDEX idx_auditoria_maquina_fecha (id_maquina, fecha_hora),
    INDEX idx_auditoria_ciclo_fecha (id_ciclo, fecha_hora),
    INDEX idx_auditoria_accion (accion),
    INDEX idx_auditoria_entidad (entidad_afectada, id_entidad_afectada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE configuracion (
    id_configuracion BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ambito VARCHAR(20) NOT NULL,
    id_lavanderia BIGINT UNSIGNED NULL,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255) NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_configuracion_lavanderia
        FOREIGN KEY (id_lavanderia) REFERENCES lavanderia(id_lavanderia)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_configuracion_lavanderia (id_lavanderia),
    CONSTRAINT uq_configuracion UNIQUE (ambito, id_lavanderia, clave),
    CONSTRAINT chk_configuracion_ambito CHECK (ambito IN ('GLOBAL', 'LAVANDERIA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
VALUES
('GLOBAL', NULL, 'moneda_incremento_euros', '1.00', 'Importe fijo por ampliación durante el ciclo'),
('GLOBAL', NULL, 'minutos_por_incremento', '9', 'Minutos añadidos por cada euro durante el ciclo');
