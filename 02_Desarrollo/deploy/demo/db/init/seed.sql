USE kwl_lavanderia;

SET @pwd_admin = '$2a$10$BO/WPcuampZtc6x7cd3WlOwWNd/e46BLcC8c8F.v8x6vUCW5Pmlue';
SET @pwd_profes = '$2b$10$q1HYXXS96AawBtzs3ABPDOzMc/9cQ/mUxhEAiD84E29MCyOv/8zcC';

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE auditoria;
TRUNCATE TABLE log_maquina;
TRUNCATE TABLE movimiento_maquina;
TRUNCATE TABLE ciclo;
TRUNCATE TABLE tarifa_maquina;
TRUNCATE TABLE maquina;
TRUNCATE TABLE usuario_lavanderia;
TRUNCATE TABLE usuario;
DELETE FROM configuracion WHERE ambito = 'LAVANDERIA';
TRUNCATE TABLE lavanderia;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO lavanderia (id_lavanderia, nombre, codigo, direccion, ciudad, provincia, activo)
VALUES
  (1, 'KWL Aqua Fleming', 'FLEM-01', 'Calle Dr. Fleming, 26', 'Ponferrada', 'León', 1),
  (2, 'KWL Aqua Puebla', 'PUEB-01', 'Av. de la Puebla 30', 'Ponferrada', 'León', 1),
  (3, 'KWL Simulador', 'SIM-01', 'SIMULADOR', 'Ponferrada', 'León', 1);

ALTER TABLE lavanderia AUTO_INCREMENT = 4;

SET @lav_flem = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'FLEM-01' LIMIT 1);
SET @lav_pueb = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'PUEB-01' LIMIT 1);
SET @lav_sim = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'SIM-01' LIMIT 1);

-- Superusuario global (rol ADMIN)
INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso)
VALUES
  ('Admin', 'Global', 'admin@gmail.com', @pwd_admin, 'ADMIN', 1, NOW() - INTERVAL 60 MINUTE);

SET @u_admin = (SELECT id_usuario FROM usuario WHERE login = 'admin@gmail.com' LIMIT 1);

-- ADMIN exclusivo para la tienda simulador (profesorado)
INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso)
VALUES
  ('Profesorado', 'Simulador', 'profes.simulador@gmail.com', @pwd_profes, 'ADMIN', 1, NULL);

SET @u_admin_sim = (SELECT id_usuario FROM usuario WHERE login = 'profes.simulador@gmail.com' LIMIT 1);

INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia)
VALUES
  (@u_admin, @lav_flem),
  (@u_admin, @lav_pueb),
  (@u_admin, @lav_sim),
  (@u_admin_sim, @lav_sim);

-- Tarifa y máquinas solo para SIMULADOR
INSERT INTO tarifa_maquina (
  id_lavanderia, nombre, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento,
  fecha_inicio_vigencia, fecha_fin_vigencia, activa
)
VALUES
  (@lav_sim, 'Tarifa Simulador', 4.00, 40, 1.00, 15, NOW() - INTERVAL 30 DAY, NULL, 1);

SET @tarifa_sim = (SELECT id_tarifa FROM tarifa_maquina WHERE id_lavanderia = @lav_sim AND activa = 1 ORDER BY id_tarifa DESC LIMIT 1);

INSERT INTO maquina (id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones)
VALUES
  (@lav_sim, 'L1', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'L2', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'L3', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'S1', 'SECADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'S2', 'SECADORA', 'STOP', 1, 'Simulador');

SET @ms_l1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L1' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_l2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L2' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_l3 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L3' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_s1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'S1' AND tipo_maquina='SECADORA' LIMIT 1);
SET @ms_s2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'S2' AND tipo_maquina='SECADORA' LIMIT 1);

INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
VALUES
  ('LAVANDERIA', @lav_sim, 'iot_state', '{"puerta_abierta": false, "luces_encendidas": false, "ventilacion_encendida": false, "updated_at": "2026-01-01T10:00:00Z"}', 'Estado IoT'),
  ('LAVANDERIA', @lav_sim, 'iot_schedule', '{"puerta":{"on":null,"off":null},"luces":{"on":null,"off":null},"ventilacion":{"on":null,"off":null}}', 'Horario IoT (inicial OFF)'),
  ('LAVANDERIA', @lav_sim, 'iot_store_actions', '{"abrir_tienda":{"puerta_abierta":true,"luces_encendidas":true},"cerrar_tienda":{"puerta_abierta":true,"luces_encendidas":true}}', 'Acciones de tienda (abrir/cerrar)'),
  ('LAVANDERIA', @lav_sim, 'iot_store_open_machines', '[]', 'Máquinas a encender con botón Abrir'),
  ('LAVANDERIA', @lav_sim, 'iot_store_close_machines', '[]', 'Máquinas a apagar con botón Cerrar'),
  ('LAVANDERIA', @lav_sim, 'env_settings', '{"CAMERA_BASE_URL":"","CAMERA_USER":"","CAMERA_PASS":"","CAMERA2_BASE_URL":"","CAMERA2_USER":"","CAMERA2_PASS":"","MQTT_URL":"mqtt://mqtt:1883","MQTT_USER":"","MQTT_PASS":"","REDIS_ENABLED":"true","REDIS_HOST":"redis","REDIS_PORT":"6379","REDIS_PASSWORD":"","REDIS_DB":"0","REDIS_TIMEOUT_MS":"1500","REDIS_KEY_PREFIX":"kwl"}', 'Ajustes por tienda para simulador');

-- Simulador: histórico base para informes
INSERT INTO ciclo (
  id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
  precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
  importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
  duracion_total_programada_min, observaciones
)
VALUES
  (@ms_l1, @tarifa_sim, NOW() - INTERVAL 80 DAY, NOW() - INTERVAL 80 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l2, @tarifa_sim, NOW() - INTERVAL 65 DAY, NOW() - INTERVAL 65 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim'),
  (@ms_l3, @tarifa_sim, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s1, @tarifa_sim, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s2, @tarifa_sim, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim');

-- Dataset anual para pruebas de Caja e Informes (solo simulador)
INSERT INTO ciclo (
  id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
  precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
  importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
  duracion_total_programada_min, observaciones
)
WITH RECURSIVE seq(n) AS (
  SELECT 0
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 364
)
SELECT
  CASE (n % 5)
    WHEN 0 THEN @ms_l1
    WHEN 1 THEN @ms_l2
    WHEN 2 THEN @ms_l3
    WHEN 3 THEN @ms_s1
    ELSE @ms_s2
  END,
  @tarifa_sim,
  (NOW() - INTERVAL (n + 1) DAY) + INTERVAL (6 + (n % 14)) HOUR + INTERVAL ((n * 7) % 60) MINUTE,
  (NOW() - INTERVAL (n + 1) DAY) + INTERVAL (6 + (n % 14)) HOUR + INTERVAL ((n * 7) % 60) MINUTE + INTERVAL (40 + IF(n % 4 = 0, 15, 0) + IF(n % 13 = 0, 15, 0)) MINUTE,
  'FINALIZADO',
  4.00,
  40,
  IF(n % 4 = 0, 15, 0) + IF(n % 13 = 0, 15, 0),
  4.00 + IF(n % 4 = 0, 1.00, 0.00) + IF(n % 13 = 0, 1.00, 0.00),
  IF(n % 9 = 0, 1.00, 0.00),
  (4.00 + IF(n % 4 = 0, 1.00, 0.00) + IF(n % 13 = 0, 1.00, 0.00)) + IF(n % 9 = 0, 1.00, 0.00),
  40 + IF(n % 4 = 0, 15, 0) + IF(n % 13 = 0, 15, 0),
  CONCAT('Seed Masivo ', n)
FROM seq;

INSERT INTO movimiento_maquina (
  id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
  tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
  es_bonificacion, descripcion
)
SELECT
  @lav_sim,
  c.id_maquina,
  c.id_ciclo,
  @u_admin,
  c.fecha_hora_inicio,
  'ARRANQUE',
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 3) = 0, 'WEB_MANUAL', 'MONEDERO'),
  4.00,
  0,
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 9) = 0, 1, 0),
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 9) = 0, 'Seed masivo arranque bonificado', 'Seed masivo arranque cliente')
FROM ciclo c
WHERE c.id_tarifa_aplicada = @tarifa_sim
  AND c.estado_ciclo = 'FINALIZADO'
  AND c.observaciones LIKE 'Seed Masivo %';

INSERT INTO movimiento_maquina (
  id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
  tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
  es_bonificacion, descripcion
)
SELECT
  @lav_sim,
  c.id_maquina,
  c.id_ciclo,
  @u_admin,
  c.fecha_hora_inicio + INTERVAL 10 MINUTE,
  'AMPLIACION_TIEMPO',
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 4) = 0, 'WEB_MANUAL', 'MONEDERO'),
  1.00,
  15,
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 12) = 0, 1, 0),
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 12) = 0, 'Seed masivo ampliación bonificada', 'Seed masivo ampliación cliente')
FROM ciclo c
WHERE c.id_tarifa_aplicada = @tarifa_sim
  AND c.estado_ciclo = 'FINALIZADO'
  AND c.minutos_extra_total > 0
  AND c.observaciones LIKE 'Seed Masivo %';

-- Dataset anual denso: varios ciclos diarios para poblar caja/informes
INSERT INTO ciclo (
  id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
  precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
  importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
  duracion_total_programada_min, observaciones
)
WITH RECURSIVE days(d) AS (
  SELECT 0
  UNION ALL
  SELECT d + 1 FROM days WHERE d < 364
),
slots(s) AS (
  SELECT 0
  UNION ALL
  SELECT s + 1 FROM slots WHERE s < 5
)
SELECT
  CASE ((d + s) % 5)
    WHEN 0 THEN @ms_l1
    WHEN 1 THEN @ms_l2
    WHEN 2 THEN @ms_l3
    WHEN 3 THEN @ms_s1
    ELSE @ms_s2
  END,
  @tarifa_sim,
  (CURDATE() - INTERVAL (d + 1) DAY)
    + INTERVAL (8 + (s * 2) + (d % 3)) HOUR
    + INTERVAL ((d * 11 + s * 13) % 60) MINUTE,
  (CURDATE() - INTERVAL (d + 1) DAY)
    + INTERVAL (8 + (s * 2) + (d % 3)) HOUR
    + INTERVAL ((d * 11 + s * 13) % 60) MINUTE
    + INTERVAL (40 + IF(((d + s) % 4) = 0, 15, 0) + IF(((d + s) % 10) = 0, 15, 0)) MINUTE,
  'FINALIZADO',
  4.00,
  40,
  IF(((d + s) % 4) = 0, 15, 0) + IF(((d + s) % 10) = 0, 15, 0),
  4.00 + IF(((d + s) % 4) = 0, 1.00, 0.00) + IF(((d + s) % 10) = 0, 1.00, 0.00),
  IF(((d + s) % 8) = 0, 1.00, 0.00),
  (4.00 + IF(((d + s) % 4) = 0, 1.00, 0.00) + IF(((d + s) % 10) = 0, 1.00, 0.00)) + IF(((d + s) % 8) = 0, 1.00, 0.00),
  40 + IF(((d + s) % 4) = 0, 15, 0) + IF(((d + s) % 10) = 0, 15, 0),
  CONCAT('Seed Denso ', d, '-', s)
FROM days
JOIN slots
WHERE
  (DAYOFWEEK(CURDATE() - INTERVAL (d + 1) DAY) IN (1, 7) AND s <= 5) OR
  (DAYOFWEEK(CURDATE() - INTERVAL (d + 1) DAY) NOT IN (1, 7) AND s <= 3);

INSERT INTO movimiento_maquina (
  id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
  tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
  es_bonificacion, descripcion
)
SELECT
  @lav_sim,
  c.id_maquina,
  c.id_ciclo,
  @u_admin,
  c.fecha_hora_inicio,
  'ARRANQUE',
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 4) = 0, 'WEB_MANUAL', 'MONEDERO'),
  4.00,
  0,
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 8) = 0, 1, 0),
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 8) = 0, 'Seed denso arranque bonificado', 'Seed denso arranque cliente')
FROM ciclo c
WHERE c.id_tarifa_aplicada = @tarifa_sim
  AND c.estado_ciclo = 'FINALIZADO'
  AND c.observaciones LIKE 'Seed Denso %';

INSERT INTO movimiento_maquina (
  id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
  tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
  es_bonificacion, descripcion
)
SELECT
  @lav_sim,
  c.id_maquina,
  c.id_ciclo,
  @u_admin,
  c.fecha_hora_inicio + INTERVAL 9 MINUTE,
  'AMPLIACION_TIEMPO',
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 5) = 0, 'WEB_MANUAL', 'MONEDERO'),
  1.00,
  15,
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 16) = 0, 1, 0),
  IF(MOD(DATEDIFF(CURDATE(), DATE(c.fecha_hora_inicio)), 16) = 0, 'Seed denso ampliacion bonificada', 'Seed denso ampliacion cliente')
FROM ciclo c
WHERE c.id_tarifa_aplicada = @tarifa_sim
  AND c.estado_ciclo = 'FINALIZADO'
  AND c.minutos_extra_total > 0
  AND c.observaciones LIKE 'Seed Denso %';
