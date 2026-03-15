USE kwl_lavanderia;

-- =========================================================
-- 1. Caja de hoy por máquina
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
    AND DATE(c.fecha_hora_inicio) = CURDATE()
WHERE m.activa = 1
GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
ORDER BY m.codigo_visible;


-- =========================================================
-- 2. Caja de una fecha concreta por máquina
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
    AND DATE(c.fecha_hora_inicio) = '2026-03-12'
WHERE m.activa = 1
GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
ORDER BY m.codigo_visible;


-- =========================================================
-- 3. Resumen diario total de una lavandería
-- =========================================================
SELECT
    l.nombre AS lavanderia,
    DATE(c.fecha_hora_inicio) AS fecha,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
WHERE l.id_lavanderia = 1
  AND DATE(c.fecha_hora_inicio) = CURDATE()
GROUP BY l.nombre, DATE(c.fecha_hora_inicio);


-- =========================================================
-- 4. Ingresos por hora de hoy
-- =========================================================
SELECT
    HOUR(c.fecha_hora_inicio) AS hora,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
  AND DATE(c.fecha_hora_inicio) = CURDATE()
GROUP BY HOUR(c.fecha_hora_inicio)
ORDER BY hora;


-- =========================================================
-- 5. Ingresos por hora de una máquina concreta
-- =========================================================
SELECT
    HOUR(c.fecha_hora_inicio) AS hora,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
WHERE c.id_maquina = 1
  AND DATE(c.fecha_hora_inicio) = CURDATE()
GROUP BY HOUR(c.fecha_hora_inicio)
ORDER BY hora;


-- =========================================================
-- 6. Evolución de los últimos 7 días
-- =========================================================
SELECT
    DATE(c.fecha_hora_inicio) AS fecha,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_cliente_total), 0) AS total_cliente,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
  AND c.fecha_hora_inicio >= CURDATE() - INTERVAL 6 DAY
GROUP BY DATE(c.fecha_hora_inicio)
ORDER BY fecha;


-- =========================================================
-- 7. Evolución semanal por máquina
-- =========================================================
SELECT
    YEAR(c.fecha_hora_inicio) AS anio,
    WEEK(c.fecha_hora_inicio, 3) AS semana,
    m.codigo_visible AS maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY YEAR(c.fecha_hora_inicio), WEEK(c.fecha_hora_inicio, 3), m.codigo_visible
ORDER BY anio DESC, semana DESC, m.codigo_visible;


-- =========================================================
-- 8. Evolución mensual por máquina
-- =========================================================
SELECT
    YEAR(c.fecha_hora_inicio) AS anio,
    MONTH(c.fecha_hora_inicio) AS mes,
    m.codigo_visible AS maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY YEAR(c.fecha_hora_inicio), MONTH(c.fecha_hora_inicio), m.codigo_visible
ORDER BY anio DESC, mes DESC, m.codigo_visible;


-- =========================================================
-- 9. Ranking de máquinas más usadas
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_total_aplicado), 0) AS total_facturado
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
ORDER BY total_ciclos DESC, total_facturado DESC;


-- =========================================================
-- 10. Ranking de máquinas con más bonificaciones
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    COALESCE(SUM(c.importe_bonificado_total), 0) AS total_bonificado
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY m.id_maquina, m.codigo_visible
ORDER BY total_bonificado DESC, total_ciclos DESC;


-- =========================================================
-- 11. Detalle de ciclos de una máquina
-- =========================================================
SELECT
    c.id_ciclo,
    m.codigo_visible AS maquina,
    c.fecha_hora_inicio,
    c.fecha_hora_fin,
    c.estado_ciclo,
    c.precio_arranque_aplicado,
    c.minutos_extra_total,
    c.duracion_total_programada_min,
    c.importe_cliente_total,
    c.importe_bonificado_total,
    c.importe_total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE c.id_maquina = 1
ORDER BY c.fecha_hora_inicio DESC
LIMIT 100;


-- =========================================================
-- 12. Ciclos bonificados por el dueño
-- =========================================================
SELECT
    c.id_ciclo,
    m.codigo_visible AS maquina,
    c.fecha_hora_inicio,
    c.importe_cliente_total,
    c.importe_bonificado_total,
    c.importe_total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE c.importe_bonificado_total > 0
ORDER BY c.fecha_hora_inicio DESC;


-- =========================================================
-- 13. Movimientos manuales desde web
-- =========================================================
SELECT
    mm.id_movimiento,
    mm.fecha_hora,
    m.codigo_visible AS maquina,
    mm.tipo_movimiento,
    mm.origen_movimiento,
    mm.importe,
    mm.minutos_extra_generados,
    mm.es_bonificacion,
    u.login AS usuario
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
LEFT JOIN usuario u ON u.id_usuario = mm.id_usuario
WHERE mm.origen_movimiento = 'WEB_MANUAL'
ORDER BY mm.fecha_hora DESC;


-- =========================================================
-- 14. Movimientos de ampliación durante ciclo
-- =========================================================
SELECT
    mm.id_movimiento,
    mm.fecha_hora,
    m.codigo_visible AS maquina,
    mm.id_ciclo,
    mm.origen_movimiento,
    mm.importe,
    mm.minutos_extra_generados,
    mm.es_bonificacion
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
WHERE mm.tipo_movimiento = 'AMPLIACION_TIEMPO'
ORDER BY mm.fecha_hora DESC;


-- =========================================================
-- 15. Total de minutos extra vendidos
-- =========================================================
SELECT
    DATE(mm.fecha_hora) AS fecha,
    SUM(mm.minutos_extra_generados) AS minutos_extra_totales,
    SUM(CASE WHEN mm.es_bonificacion = 0 THEN mm.minutos_extra_generados ELSE 0 END) AS minutos_extra_pagados,
    SUM(CASE WHEN mm.es_bonificacion = 1 THEN mm.minutos_extra_generados ELSE 0 END) AS minutos_extra_bonificados
FROM movimiento_maquina mm
WHERE mm.tipo_movimiento = 'AMPLIACION_TIEMPO'
GROUP BY DATE(mm.fecha_hora)
ORDER BY fecha DESC;


-- =========================================================
-- 16. Comparativa entre dinero real y bonificado
-- =========================================================
SELECT
    DATE(c.fecha_hora_inicio) AS fecha,
    SUM(c.importe_cliente_total) AS dinero_real,
    SUM(c.importe_bonificado_total) AS dinero_bonificado,
    SUM(c.importe_total_aplicado) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY DATE(c.fecha_hora_inicio)
ORDER BY fecha DESC;


-- =========================================================
-- 17. Últimos eventos técnicos de una máquina
-- =========================================================
SELECT
    lm.fecha_hora,
    m.codigo_visible AS maquina,
    lm.tipo_evento,
    lm.nivel,
    lm.payload,
    lm.procesado
FROM log_maquina lm
INNER JOIN maquina m ON m.id_maquina = lm.id_maquina
WHERE lm.id_maquina = 1
ORDER BY lm.fecha_hora DESC
LIMIT 100;


-- =========================================================
-- 18. Máquinas con más errores técnicos
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    COUNT(lm.id_log) AS total_errores
FROM log_maquina lm
INNER JOIN maquina m ON m.id_maquina = lm.id_maquina
WHERE lm.nivel IN ('ERROR', 'CRITICAL')
GROUP BY m.id_maquina, m.codigo_visible
ORDER BY total_errores DESC;


-- =========================================================
-- 19. Auditoría de acciones de usuarios
-- =========================================================
SELECT
    a.fecha_hora,
    u.login AS usuario,
    a.accion,
    a.entidad_afectada,
    a.id_entidad_afectada,
    a.detalle,
    a.ip_origen
FROM auditoria a
INNER JOIN usuario u ON u.id_usuario = a.id_usuario
ORDER BY a.fecha_hora DESC
LIMIT 200;


-- =========================================================
-- 20. Usuarios que más bonificaciones aplican
-- =========================================================
SELECT
    u.login AS usuario,
    COUNT(mm.id_movimiento) AS total_acciones,
    COALESCE(SUM(mm.importe), 0) AS total_bonificado
FROM movimiento_maquina mm
INNER JOIN usuario u ON u.id_usuario = mm.id_usuario
WHERE mm.es_bonificacion = 1
GROUP BY u.id_usuario, u.login
ORDER BY total_bonificado DESC, total_acciones DESC;


-- =========================================================
-- 21. Máquinas sin actividad hoy
-- =========================================================
SELECT
    m.id_maquina,
    m.codigo_visible,
    m.tipo_maquina
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
    AND DATE(c.fecha_hora_inicio) = CURDATE()
WHERE m.id_lavanderia = 1
  AND m.activa = 1
GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
HAVING COUNT(c.id_ciclo) = 0
ORDER BY m.codigo_visible;


-- =========================================================
-- 22. Máquinas activas con último ciclo antiguo
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    MAX(c.fecha_hora_inicio) AS ultimo_ciclo
FROM maquina m
LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
WHERE m.id_lavanderia = 1
  AND m.activa = 1
GROUP BY m.id_maquina, m.codigo_visible
ORDER BY ultimo_ciclo ASC;


-- =========================================================
-- 23. Tiempo medio extra por ciclo
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    AVG(c.minutos_extra_total) AS media_minutos_extra
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY m.id_maquina, m.codigo_visible
ORDER BY media_minutos_extra DESC;


-- =========================================================
-- 24. Duración media real por máquina
-- =========================================================
SELECT
    m.codigo_visible AS maquina,
    AVG(c.duracion_total_programada_min) AS duracion_media_min
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY m.id_maquina, m.codigo_visible
ORDER BY duracion_media_min DESC;


-- =========================================================
-- 25. Tarifa vigente de cada lavandería
-- =========================================================
SELECT
    l.nombre AS lavanderia,
    tm.precio_arranque,
    tm.tiempo_base_minutos,
    tm.importe_incremento,
    tm.minutos_por_incremento,
    tm.fecha_inicio_vigencia,
    tm.fecha_fin_vigencia
FROM tarifa_maquina tm
INNER JOIN lavanderia l ON l.id_lavanderia = tm.id_lavanderia
WHERE tm.activa = 1
ORDER BY l.nombre, tm.fecha_inicio_vigencia DESC;


-- =========================================================
-- 26. Ciclos por tipo de máquina
-- =========================================================
SELECT
    m.tipo_maquina,
    COUNT(c.id_ciclo) AS total_ciclos,
    SUM(c.importe_total_aplicado) AS total_facturado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY m.tipo_maquina
ORDER BY total_facturado DESC;


-- =========================================================
-- 27. Bonificaciones aplicadas hoy
-- =========================================================
SELECT
    mm.fecha_hora,
    m.codigo_visible AS maquina,
    mm.tipo_movimiento,
    mm.importe,
    mm.minutos_extra_generados,
    u.login AS usuario
FROM movimiento_maquina mm
INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
LEFT JOIN usuario u ON u.id_usuario = mm.id_usuario
WHERE mm.es_bonificacion = 1
  AND DATE(mm.fecha_hora) = CURDATE()
ORDER BY mm.fecha_hora DESC;


-- =========================================================
-- 28. Resumen económico mensual de la lavandería
-- =========================================================
SELECT
    YEAR(c.fecha_hora_inicio) AS anio,
    MONTH(c.fecha_hora_inicio) AS mes,
    COUNT(c.id_ciclo) AS total_ciclos,
    SUM(c.importe_cliente_total) AS total_cliente,
    SUM(c.importe_bonificado_total) AS total_bonificado,
    SUM(c.importe_total_aplicado) AS total_aplicado
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE m.id_lavanderia = 1
GROUP BY YEAR(c.fecha_hora_inicio), MONTH(c.fecha_hora_inicio)
ORDER BY anio DESC, mes DESC;


-- =========================================================
-- 29. Detección de ciclos posiblemente anómalos
--    Ejemplo: ciclos con mucho tiempo extra
-- =========================================================
SELECT
    c.id_ciclo,
    m.codigo_visible AS maquina,
    c.fecha_hora_inicio,
    c.minutos_extra_total,
    c.duracion_total_programada_min,
    c.importe_cliente_total,
    c.importe_bonificado_total
FROM ciclo c
INNER JOIN maquina m ON m.id_maquina = c.id_maquina
WHERE c.minutos_extra_total >= 30
ORDER BY c.minutos_extra_total DESC, c.fecha_hora_inicio DESC;


-- =========================================================
-- 30. Detalle completo de un ciclo
-- =========================================================
SELECT
    c.id_ciclo,
    l.nombre AS lavanderia,
    m.codigo_visible AS maquina,
    m.tipo_maquina,
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
INNER JOIN lavanderia l ON l.id_lavanderia = m.id_lavanderia
WHERE c.id_ciclo = 1;