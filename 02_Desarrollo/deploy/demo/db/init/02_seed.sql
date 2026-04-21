USE kwl_lavanderia;

-- Lavandería demo (id 1)
INSERT INTO lavanderia (nombre, codigo, direccion, ciudad, provincia, activo)
VALUES ('KWL Aqua Ponferrada', 'PONF-01', 'Calle Dr. Fleming, 26', 'Ponferrada', 'León', 1)
ON DUPLICATE KEY UPDATE codigo = codigo;

-- Usuario admin demo (login: admin / pass: admin)
INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo)
VALUES ('Admin', NULL, 'admin@gmail.com', '$2a$10$BO/WPcuampZtc6x7cd3WlOwWNd/e46BLcC8c8F.v8x6vUCW5Pmlue', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE login = login;

-- Vincular usuario a lavandería
INSERT IGNORE INTO usuario_lavanderia (id_usuario, id_lavanderia)
SELECT u.id_usuario, l.id_lavanderia
FROM usuario u
JOIN lavanderia l ON l.codigo = 'PONF-01'
WHERE u.login = 'admin@gmail.com';

-- Tarifa demo
INSERT INTO tarifa_maquina (
  id_lavanderia, nombre, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento,
  fecha_inicio_vigencia, fecha_fin_vigencia, activa
)
SELECT l.id_lavanderia, 'Tarifa demo', 4.00, 35, 1.00, 9, NOW(), NULL, 1
FROM lavanderia l
WHERE l.codigo = 'PONF-01';

-- Máquinas demo (L1 / S1)
INSERT IGNORE INTO maquina (id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones)
SELECT l.id_lavanderia, 'L1', 'LAVADORA', 'STOP', 1, 'Demo'
FROM lavanderia l
WHERE l.codigo = 'PONF-01';

INSERT IGNORE INTO maquina (id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones)
SELECT l.id_lavanderia, 'S1', 'SECADORA', 'STOP', 1, 'Demo'
FROM lavanderia l
WHERE l.codigo = 'PONF-01';
