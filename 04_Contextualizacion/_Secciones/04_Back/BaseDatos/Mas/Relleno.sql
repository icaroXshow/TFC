-- =========================================
-- SEED DATA - LAVANDERIA KWL
-- =========================================

USE kwl_lavanderia;

-- ===============================
-- Lavandería inicial
-- ===============================
INSERT INTO lavanderia (
    id_lavanderia,
    nombre,
    codigo,
    direccion,
    ciudad,
    provincia,
    activo,
    fecha_alta
) VALUES (
    1,
    'Lavandería KWL Ponferrada',
    'KWL-PON',
    'Direccion pendiente',
    'Ponferrada',
    'León',
    1,
    NOW()
);

-- ===============================
-- Usuario administrador
-- ===============================
INSERT INTO usuario (
    id_usuario,
    nombre,
    apellidos,
    login,
    password_hash,
    rol,
    activo,
    fecha_creacion
) VALUES (
    1,
    'Admin',
    'Sistema',
    'admin',
    '$2y$10$examplehashcambiar', -- cambiar luego
    'ADMIN',
    1,
    NOW()
);

-- ===============================
-- Tarifa inicial
-- ===============================
INSERT INTO tarifa_maquina (
    id_tarifa,
    id_lavanderia,
    precio_arranque,
    tiempo_base_minutos,
    importe_incremento,
    minutos_por_incremento,
    fecha_inicio_vigencia,
    activa
) VALUES (
    1,
    1,
    4.50,
    37,
    1.00,
    9,
    NOW(),
    1
);

-- ===============================
-- Máquinas de ejemplo
-- ===============================
INSERT INTO maquina (
    id_maquina,
    id_lavanderia,
    codigo_visible,
    tipo_maquina,
    estado_actual,
    activa,
    fecha_alta
) VALUES
(1,1,'L1','LAVADORA','STOP',1,NOW()),
(2,1,'L2','LAVADORA','STOP',1,NOW()),
(3,1,'L3','LAVADORA','STOP',1,NOW()),
(4,1,'L4','LAVADORA','STOP',1,NOW()),
(5,1,'S1','SECADORA','STOP',1,NOW()),
(6,1,'S2','SECADORA','STOP',1,NOW()),
(7,1,'S3','SECADORA','STOP',1,NOW());

-- ===============================
-- Configuración global
-- ===============================
INSERT INTO configuracion (
    ambito,
    clave,
    valor,
    descripcion,
    fecha_actualizacion
) VALUES
('GLOBAL','MINUTOS_POR_EURO','9','Minutos añadidos por cada euro',NOW()),
('GLOBAL','PRECIO_ARRANQUE_DEFAULT','4.50','Precio de arranque por defecto',NOW()),
('GLOBAL','TIEMPO_BASE_DEFAULT','37','Duracion base del ciclo',NOW());