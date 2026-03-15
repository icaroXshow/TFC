-- =========================================
-- VIEWS - LAVANDERIA KWL
-- =========================================

USE kwl_lavanderia;

-- =========================================================
-- 1. Resumen completo de ciclos
-- =========================================================
CREATE OR REPLACE VIEW vw_resumen_ciclos AS
SELECT
    c.id_ciclo,
    c.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    m.id_lavanderia,
    l.nombre AS lavanderia,
    c.fecha_hora_inicio,
    c.fecha_hora_fin,
    c.estado_ciclo,
    c.precio_arranque_aplicado,
    c.tiempo_base_aplicado_min,
    c.minutos_extra_total,
    c.duracion_total_programada_min,
    c.importe_cliente_total,
    c.importe_bonificado_total,
    c.importe_total_aplicado,
    c.observaciones
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia;

-- =========================================================
-- 2. Caja diaria por máquina
--    Útil para la pantalla tipo "Caja del día"
-- =========================================================
CREATE OR REPLACE VIEW vw_caja_diaria_maquina AS
SELECT
    DATE(c.fecha_hora_inicio) AS fecha,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    m.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
GROUP BY
    DATE(c.fecha_hora_inicio),
    l.id_lavanderia,
    l.nombre,
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina;

-- =========================================================
-- 3. Movimientos diarios por máquina
--    Separa dinero real de bonificaciones
-- =========================================================
CREATE OR REPLACE VIEW vw_movimientos_diarios_maquina AS
SELECT
    DATE(mm.fecha_hora) AS fecha,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    m.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(mm.id_movimiento) AS total_movimientos,
    COALESCE(SUM(CASE WHEN mm.es_bonificacion = 0 THEN mm.importe ELSE 0 END), 0) AS importe_real_cliente,
    COALESCE(SUM(CASE WHEN mm.es_bonificacion = 1 THEN mm.importe ELSE 0 END), 0) AS importe_bonificado,
    COALESCE(SUM(mm.importe), 0) AS importe_total_movimientos
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = mm.id_lavanderia
GROUP BY
    DATE(mm.fecha_hora),
    l.id_lavanderia,
    l.nombre,
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina;

-- =========================================================
-- 4. Ingresos por hora
--    Útil para estadísticas por tramo horario
-- =========================================================
CREATE OR REPLACE VIEW vw_ingresos_por_hora AS
SELECT
    DATE(c.fecha_hora_inicio) AS fecha,
    HOUR(c.fecha_hora_inicio) AS hora,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    m.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
GROUP BY
    DATE(c.fecha_hora_inicio),
    HOUR(c.fecha_hora_inicio),
    l.id_lavanderia,
    l.nombre,
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina;

-- =========================================================
-- 5. Evolución semanal por máquina
-- =========================================================
CREATE OR REPLACE VIEW vw_evolucion_semanal_maquina AS
SELECT
    YEAR(c.fecha_hora_inicio) AS anio,
    WEEK(c.fecha_hora_inicio, 3) AS semana,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    m.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
GROUP BY
    YEAR(c.fecha_hora_inicio),
    WEEK(c.fecha_hora_inicio, 3),
    l.id_lavanderia,
    l.nombre,
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina;

-- =========================================================
-- 6. Evolución mensual por máquina
-- =========================================================
CREATE OR REPLACE VIEW vw_evolucion_mensual_maquina AS
SELECT
    YEAR(c.fecha_hora_inicio) AS anio,
    MONTH(c.fecha_hora_inicio) AS mes,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    m.id_maquina,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
GROUP BY
    YEAR(c.fecha_hora_inicio),
    MONTH(c.fecha_hora_inicio),
    l.id_lavanderia,
    l.nombre,
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina;

-- =========================================================
-- 7. Resumen diario por lavandería
-- =========================================================
CREATE OR REPLACE VIEW vw_resumen_diario_lavanderia AS
SELECT
    DATE(c.fecha_hora_inicio) AS fecha,
    l.id_lavanderia,
    l.nombre AS lavanderia,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
GROUP BY
    DATE(c.fecha_hora_inicio),
    l.id_lavanderia,
    l.nombre;

-- =========================================================
-- 8. Ampliaciones de tiempo
--    Para analizar cuánto tiempo extra se añade
-- =========================================================
CREATE OR REPLACE VIEW vw_ampliaciones_tiempo AS
SELECT
    mm.id_movimiento,
    mm.fecha_hora,
    mm.id_lavanderia,
    l.nombre AS lavanderia,
    mm.id_maquina,
    m.codigo_visible AS maquina,
    mm.id_ciclo,
    mm.origen_movimiento,
    mm.importe,
    mm.minutos_extra_generados,
    mm.es_bonificacion,
    mm.descripcion
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = mm.id_lavanderia
WHERE mm.tipo_movimiento = 'AMPLIACION_TIEMPO';

-- =========================================================
-- 9. Arranques de máquina
-- =========================================================
CREATE OR REPLACE VIEW vw_arranques_maquina AS
SELECT
    mm.id_movimiento,
    mm.fecha_hora,
    mm.id_lavanderia,
    l.nombre AS lavanderia,
    mm.id_maquina,
    m.codigo_visible AS maquina,
    mm.id_ciclo,
    mm.origen_movimiento,
    mm.importe,
    mm.es_bonificacion,
    mm.descripcion
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = mm.id_lavanderia
WHERE mm.tipo_movimiento = 'ARRANQUE';