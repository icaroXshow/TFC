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

INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso)
VALUES
  ('Admin', 'Global', 'admin@gmail.com', @pwd_admin, 'ADMIN', 1, NOW() - INTERVAL 60 MINUTE),
  ('Operador', 'Fleming', 'operador@gmail.com', @pwd_admin, 'OPERADOR', 1, NOW() - INTERVAL 1 DAY),
  ('Operador', 'Puebla', 'operador2@gmail.com', @pwd_admin, 'OPERADOR', 1, NOW() - INTERVAL 3 HOUR);

SET @u_admin = (SELECT id_usuario FROM usuario WHERE login = 'admin@gmail.com' LIMIT 1);
SET @u_oper_flem = (SELECT id_usuario FROM usuario WHERE login = 'operador@gmail.com' LIMIT 1);
SET @u_oper_pueb = (SELECT id_usuario FROM usuario WHERE login = 'operador2@gmail.com' LIMIT 1);

INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia)
VALUES
  (@u_admin, @lav_flem),
  (@u_admin, @lav_pueb),
  (@u_admin, @lav_sim),
  (@u_oper_flem, @lav_flem),
  (@u_oper_pueb, @lav_pueb);

INSERT INTO tarifa_maquina (
  id_lavanderia, nombre, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento,
  fecha_inicio_vigencia, fecha_fin_vigencia, activa
)
VALUES
  (@lav_flem, 'Tarifa Fleming', 4.00, 35, 1.00, 9, NOW() - INTERVAL 30 DAY, NULL, 1),
  (@lav_pueb, 'Tarifa Puebla', 4.20, 36, 1.00, 9, NOW() - INTERVAL 30 DAY, NULL, 1),
  (@lav_sim, 'Tarifa Simulador', 4.00, 40, 1.00, 15, NOW() - INTERVAL 30 DAY, NULL, 1);

SET @tarifa_flem = (SELECT id_tarifa FROM tarifa_maquina WHERE id_lavanderia = @lav_flem AND activa = 1 ORDER BY id_tarifa DESC LIMIT 1);
SET @tarifa_pueb = (SELECT id_tarifa FROM tarifa_maquina WHERE id_lavanderia = @lav_pueb AND activa = 1 ORDER BY id_tarifa DESC LIMIT 1);
SET @tarifa_sim = (SELECT id_tarifa FROM tarifa_maquina WHERE id_lavanderia = @lav_sim AND activa = 1 ORDER BY id_tarifa DESC LIMIT 1);

INSERT INTO maquina (id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones)
VALUES
  (@lav_flem, 'L1', 'LAVADORA', 'STOP', 1, 'Demo'),
  (@lav_flem, 'L2', 'LAVADORA', 'EN_MARCHA', 1, 'Demo'),
  (@lav_flem, 'L3', 'LAVADORA', 'STOP', 1, 'Demo'),
  (@lav_flem, 'S1', 'SECADORA', 'STOP', 1, 'Demo'),
  (@lav_flem, 'S2', 'SECADORA', 'STOP', 1, 'Demo'),
  (@lav_pueb, 'L1', 'LAVADORA', 'STOP', 1, 'Demo'),
  (@lav_pueb, 'L2', 'LAVADORA', 'STOP', 1, 'Demo'),
  (@lav_pueb, 'L3', 'LAVADORA', 'STOP', 1, 'Demo'),
  (@lav_pueb, 'S1', 'SECADORA', 'EN_MARCHA', 1, 'Demo'),
  (@lav_pueb, 'S2', 'SECADORA', 'STOP', 1, 'Demo'),
  (@lav_sim, 'L1', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'L2', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'L3', 'LAVADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'S1', 'SECADORA', 'STOP', 1, 'Simulador'),
  (@lav_sim, 'S2', 'SECADORA', 'STOP', 1, 'Simulador');

SET @mf_l1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_flem AND codigo_visible = 'L1' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @mf_l2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_flem AND codigo_visible = 'L2' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @mf_l3 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_flem AND codigo_visible = 'L3' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @mf_s1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_flem AND codigo_visible = 'S1' AND tipo_maquina='SECADORA' LIMIT 1);
SET @mf_s2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_flem AND codigo_visible = 'S2' AND tipo_maquina='SECADORA' LIMIT 1);
SET @mp_l1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_pueb AND codigo_visible = 'L1' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @mp_s1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_pueb AND codigo_visible = 'S1' AND tipo_maquina='SECADORA' LIMIT 1);
SET @ms_l1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L1' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_l2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L2' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_l3 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'L3' AND tipo_maquina='LAVADORA' LIMIT 1);
SET @ms_s1 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'S1' AND tipo_maquina='SECADORA' LIMIT 1);
SET @ms_s2 = (SELECT id_maquina FROM maquina WHERE id_lavanderia = @lav_sim AND codigo_visible = 'S2' AND tipo_maquina='SECADORA' LIMIT 1);

INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
VALUES
  ('LAVANDERIA', @lav_flem, 'iot_state', '{"puerta_abierta": false, "luces_encendidas": true, "ventilacion_encendida": false, "updated_at": "2026-01-01T10:00:00Z"}', 'Estado IoT'),
  ('LAVANDERIA', @lav_flem, 'iot_schedule', '{"puerta":{"on":"02:10","off":"03:30"},"luces":{"on":"02:20","off":"03:40"},"ventilacion":{"on":"02:30","off":"03:50"}}', 'Horario IoT'),
  ('LAVANDERIA', @lav_pueb, 'iot_state', '{"puerta_abierta": false, "luces_encendidas": false, "ventilacion_encendida": true, "updated_at": "2026-01-01T10:00:00Z"}', 'Estado IoT'),
  ('LAVANDERIA', @lav_pueb, 'iot_schedule', '{"puerta":{"on":"02:15","off":"03:25"},"luces":{"on":"02:25","off":"03:35"},"ventilacion":{"on":"02:35","off":"03:55"}}', 'Horario IoT'),
  ('LAVANDERIA', @lav_sim, 'iot_state', '{"puerta_abierta": false, "luces_encendidas": false, "ventilacion_encendida": false, "updated_at": "2026-01-01T10:00:00Z"}', 'Estado IoT'),
  ('LAVANDERIA', @lav_sim, 'iot_schedule', '{"puerta":{"on":"02:00","off":"03:50"},"luces":{"on":"02:05","off":"03:55"},"ventilacion":{"on":"02:10","off":"03:45"}}', 'Horario IoT'),
  ('LAVANDERIA', @lav_sim, 'env_settings', '{"CAMERA_BASE_URL":"","CAMERA_USER":"","CAMERA_PASS":"","MQTT_URL":"mqtt://mqtt:1883"}', 'Ajustes por tienda para simulador');

INSERT INTO ciclo (
  id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
  precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
  importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
  duracion_total_programada_min, observaciones
)
VALUES
  (@mf_l1, @tarifa_flem, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 44 MINUTE, 'FINALIZADO', 4.00, 35, 9, 5.00, 0.00, 5.00, 44, 'Seed'),
  (@mf_l3, @tarifa_flem, NOW() - INTERVAL 36 HOUR, NOW() - INTERVAL 36 HOUR + INTERVAL 35 MINUTE, 'FINALIZADO', 4.00, 35, 0, 4.00, 0.00, 4.00, 35, 'Seed'),
  (@mf_s1, @tarifa_flem, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 35 MINUTE, 'FINALIZADO', 4.00, 35, 0, 4.00, 0.00, 4.00, 35, 'Seed'),
  (@mf_s2, @tarifa_flem, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 12 HOUR + INTERVAL 35 MINUTE, 'FINALIZADO', 4.00, 35, 0, 4.00, 0.00, 4.00, 35, 'Seed'),
  (@mf_l2, @tarifa_flem, NOW() - INTERVAL 20 MINUTE, NULL, 'INICIADO', 4.00, 35, 0, 0.00, 4.00, 4.00, 35, 'Seed'),
  (@mp_l1, @tarifa_pueb, NOW() - INTERVAL 30 HOUR, NOW() - INTERVAL 30 HOUR + INTERVAL 36 MINUTE, 'FINALIZADO', 4.20, 36, 0, 4.20, 0.00, 4.20, 36, 'Seed'),
  (@mp_s1, @tarifa_pueb, NOW() - INTERVAL 15 MINUTE, NULL, 'INICIADO', 4.20, 36, 0, 0.00, 4.20, 4.20, 36, 'Seed'),
  -- Simulador: histórico amplio para Informes (evolución y tramos)
  (@ms_l1, @tarifa_sim, NOW() - INTERVAL 80 DAY, NOW() - INTERVAL 80 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l2, @tarifa_sim, NOW() - INTERVAL 65 DAY, NOW() - INTERVAL 65 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim'),
  (@ms_l3, @tarifa_sim, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s1, @tarifa_sim, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s2, @tarifa_sim, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim'),
  (@ms_l1, @tarifa_sim, NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 21 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l2, @tarifa_sim, NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l3, @tarifa_sim, NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim'),
  (@ms_s1, @tarifa_sim, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s2, @tarifa_sim, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l1, @tarifa_sim, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_l2, @tarifa_sim, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim'),
  (@ms_l3, @tarifa_sim, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s1, @tarifa_sim, NOW() - INTERVAL 18 HOUR, NOW() - INTERVAL 18 HOUR + INTERVAL 40 MINUTE, 'FINALIZADO', 4.00, 40, 0, 4.00, 0.00, 4.00, 40, 'Seed Sim'),
  (@ms_s2, @tarifa_sim, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 12 HOUR + INTERVAL 55 MINUTE, 'FINALIZADO', 4.00, 40, 15, 5.00, 0.00, 5.00, 55, 'Seed Sim');

SET @cf_l1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mf_l1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cf_l2 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mf_l2 ORDER BY id_ciclo DESC LIMIT 1);
SET @cf_l3 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mf_l3 ORDER BY id_ciclo DESC LIMIT 1);
SET @cf_s1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mf_s1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cf_s2 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mf_s2 ORDER BY id_ciclo DESC LIMIT 1);
SET @cp_l1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mp_l1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cp_s1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @mp_s1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cs_l1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @ms_l1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cs_l2 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @ms_l2 ORDER BY id_ciclo DESC LIMIT 1);
SET @cs_l3 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @ms_l3 ORDER BY id_ciclo DESC LIMIT 1);
SET @cs_s1 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @ms_s1 ORDER BY id_ciclo DESC LIMIT 1);
SET @cs_s2 = (SELECT id_ciclo FROM ciclo WHERE id_maquina = @ms_s2 ORDER BY id_ciclo DESC LIMIT 1);

INSERT INTO movimiento_maquina (
  id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
  tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
  es_bonificacion, descripcion
)
VALUES
  (@lav_flem, @mf_l1, @cf_l1, @u_admin, NOW() - INTERVAL 2 DAY, 'ARRANQUE', 'MONEDERO', 4.00, 0, 0, 'Seed'),
  (@lav_flem, @mf_l1, @cf_l1, @u_admin, NOW() - INTERVAL 2 DAY + INTERVAL 6 MINUTE, 'AMPLIACION_TIEMPO', 'MONEDERO', 1.00, 9, 0, 'Seed'),
  (@lav_flem, @mf_l3, @cf_l3, @u_oper_flem, NOW() - INTERVAL 36 HOUR, 'ARRANQUE', 'MONEDERO', 4.00, 0, 0, 'Seed'),
  (@lav_flem, @mf_s1, @cf_s1, @u_oper_flem, NOW() - INTERVAL 1 DAY, 'ARRANQUE', 'MONEDERO', 4.00, 0, 0, 'Seed'),
  (@lav_flem, @mf_s2, @cf_s2, @u_oper_flem, NOW() - INTERVAL 12 HOUR, 'ARRANQUE', 'MONEDERO', 4.00, 0, 0, 'Seed'),
  (@lav_pueb, @mp_l1, @cp_l1, @u_oper_pueb, NOW() - INTERVAL 30 HOUR, 'ARRANQUE', 'MONEDERO', 4.20, 0, 0, 'Seed'),
  (@lav_sim, @ms_l1, @cs_l1, @u_admin, NOW() - INTERVAL 3 DAY, 'ARRANQUE', 'WEB_MANUAL', 4.00, 0, 0, 'Seed Sim'),
  (@lav_sim, @ms_l2, @cs_l2, @u_admin, NOW() - INTERVAL 2 DAY, 'ARRANQUE', 'WEB_MANUAL', 4.00, 0, 0, 'Seed Sim'),
  (@lav_sim, @ms_l2, @cs_l2, @u_admin, NOW() - INTERVAL 2 DAY + INTERVAL 10 MINUTE, 'AMPLIACION_TIEMPO', 'WEB_MANUAL', 1.00, 15, 0, 'Seed Sim'),
  (@lav_sim, @ms_l3, @cs_l3, @u_admin, NOW() - INTERVAL 1 DAY, 'ARRANQUE', 'WEB_MANUAL', 4.00, 0, 0, 'Seed Sim'),
  (@lav_sim, @ms_s1, @cs_s1, @u_admin, NOW() - INTERVAL 18 HOUR, 'ARRANQUE', 'WEB_MANUAL', 4.00, 0, 0, 'Seed Sim'),
  (@lav_sim, @ms_s2, @cs_s2, @u_admin, NOW() - INTERVAL 12 HOUR, 'ARRANQUE', 'WEB_MANUAL', 4.00, 0, 0, 'Seed Sim'),
  (@lav_sim, @ms_s2, @cs_s2, @u_admin, NOW() - INTERVAL 11 HOUR + INTERVAL 35 MINUTE, 'AMPLIACION_TIEMPO', 'WEB_MANUAL', 1.00, 15, 0, 'Seed Sim');

INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
VALUES
  (@lav_flem, @mf_l1, @cf_l1, NOW() - INTERVAL 2 DAY, 'CICLO_INICIADO', 'INFO', JSON_OBJECT('origen','seed'), 1),
  (@lav_flem, @mf_l1, @cf_l1, NOW() - INTERVAL 2 DAY + INTERVAL 44 MINUTE, 'CICLO_FINALIZADO', 'INFO', JSON_OBJECT('origen','seed'), 1),
  (@lav_flem, @mf_l2, @cf_l2, NOW() - INTERVAL 20 MINUTE, 'MQTT_ESTADO', 'INFO', JSON_OBJECT('estado','EN_MARCHA'), 1),
  (@lav_pueb, @mp_s1, @cp_s1, NOW() - INTERVAL 15 MINUTE, 'MQTT_ESTADO', 'INFO', JSON_OBJECT('estado','EN_MARCHA'), 1);

INSERT INTO auditoria (
  id_usuario, id_lavanderia, id_maquina, id_ciclo,
  fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
)
VALUES
  (@u_admin, @lav_flem, @mf_l2, @cf_l2, NOW() - INTERVAL 20 MINUTE, 'MAQUINA_INICIAR', 'maquina', @mf_l2, 'Seed', '127.0.0.1'),
  (@u_admin, @lav_pueb, @mp_s1, @cp_s1, NOW() - INTERVAL 15 MINUTE, 'MAQUINA_INICIAR', 'maquina', @mp_s1, 'Seed', '127.0.0.1');
