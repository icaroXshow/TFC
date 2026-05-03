USE kwl_lavanderia;

SET @pwd_admin = '$2a$10$BO/WPcuampZtc6x7cd3WlOwWNd/e46BLcC8c8F.v8x6vUCW5Pmlue';

DELETE FROM auditoria;
DELETE FROM log_maquina;
DELETE FROM movimiento_maquina;
DELETE FROM ciclo;
DELETE FROM tarifa_maquina;
DELETE FROM maquina;
DELETE FROM usuario_lavanderia;
DELETE FROM usuario;
DELETE FROM configuracion WHERE ambito = 'LAVANDERIA';
DELETE FROM lavanderia;

INSERT INTO lavanderia (nombre, codigo, direccion, ciudad, provincia, activo)
VALUES
  ('KWL Aqua Fleming', 'FLEM-01', 'Calle Dr. Fleming, 26', 'Ponferrada', 'León', 1),
  ('KWL Aqua Puebla', 'PUEB-01', 'Av. de la Puebla 30', 'Ponferrada', 'León', 1),
  ('KWL Simulador', 'SIM-01', 'SIMULADOR', 'Ponferrada', 'León', 1);

SET @lav_flem = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'FLEM-01' LIMIT 1);
SET @lav_pueb = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'PUEB-01' LIMIT 1);
SET @lav_sim = (SELECT id_lavanderia FROM lavanderia WHERE codigo = 'SIM-01' LIMIT 1);

-- Un único superusuario (rol ADMIN)
INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso)
VALUES
  ('Admin', 'Global', 'admin@gmail.com', @pwd_admin, 'ADMIN', 1, NOW() - INTERVAL 60 MINUTE);

SET @u_admin = (SELECT id_usuario FROM usuario WHERE login = 'admin@gmail.com' LIMIT 1);

INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia)
VALUES
  (@u_admin, @lav_flem),
  (@u_admin, @lav_pueb),
  (@u_admin, @lav_sim);

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
  ('LAVANDERIA', @lav_sim, 'iot_schedule', '{"puerta":{"on":"02:00","off":"03:50"},"luces":{"on":"02:05","off":"03:55"},"ventilacion":{"on":"02:10","off":"03:45"}}', 'Horario IoT'),
  ('LAVANDERIA', @lav_sim, 'env_settings', '{"CAMERA_BASE_URL":"","CAMERA_USER":"","CAMERA_PASS":"","CAMERA2_BASE_URL":"","CAMERA2_USER":"","CAMERA2_PASS":"","MQTT_URL":"mqtt://mqtt:1883","MQTT_USER":"","MQTT_PASS":"","REDIS_ENABLED":"true","REDIS_HOST":"redis","REDIS_PORT":"6379","REDIS_PASSWORD":"","REDIS_DB":"0","REDIS_TIMEOUT_MS":"500","REDIS_KEY_PREFIX":"kwl"}', 'Ajustes por tienda para simulador');

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

-- Dataset masivo para pruebas de Caja e Informes (simulador)
WITH RECURSIVE seq(n) AS (
  SELECT 0
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 179
)
INSERT INTO ciclo (
  id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
  precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
  importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
  duracion_total_programada_min, observaciones
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
  (NOW() - INTERVAL (n + 1) DAY) + INTERVAL (6 + (n % 14)) HOUR,
  (NOW() - INTERVAL (n + 1) DAY) + INTERVAL (6 + (n % 14)) HOUR + INTERVAL (40 + IF(n % 4 = 0, 15, 0)) MINUTE,
  'FINALIZADO',
  4.00,
  40,
  IF(n % 4 = 0, 15, 0),
  4.00 + IF(n % 4 = 0, 1.00, 0.00),
  0.00,
  4.00 + IF(n % 4 = 0, 1.00, 0.00),
  40 + IF(n % 4 = 0, 15, 0),
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
  'WEB_MANUAL',
  4.00,
  0,
  0,
  'Seed masivo arranque'
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
  'WEB_MANUAL',
  1.00,
  15,
  0,
  'Seed masivo ampliación'
FROM ciclo c
WHERE c.id_tarifa_aplicada = @tarifa_sim
  AND c.estado_ciclo = 'FINALIZADO'
  AND c.minutos_extra_total > 0
  AND c.observaciones LIKE 'Seed Masivo %';
