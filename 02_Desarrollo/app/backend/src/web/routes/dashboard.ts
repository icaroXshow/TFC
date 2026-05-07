import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia } from "../auth/middleware.js";

export const dashboardRouter = Router();

type SummaryRow = RowDataPacket & {
  maquinas_total: number;
  maquinas_activas: number;
};

type CountRow = RowDataPacket & { ciclos_hoy: number };
type LastEventRow = RowDataPacket & { tipo_evento: string; fecha_hora: Date; nivel: string };

dashboardRouter.get("/resumen", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const [summaryRows] = await db.query<SummaryRow[]>(
    `
    SELECT
      COUNT(*) AS maquinas_total,
      SUM(CASE WHEN estado_actual = 'EN_MARCHA' THEN 1 ELSE 0 END) AS maquinas_activas
    FROM maquina
    WHERE id_lavanderia = :idLav
    `,
    { idLav },
  );
  const [cycleRows] = await db.query<CountRow[]>(
    `
    SELECT COUNT(*) AS ciclos_hoy
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE m.id_lavanderia = :idLav
      AND c.fecha_hora_inicio >= CURDATE()
      AND c.fecha_hora_inicio < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `,
    { idLav },
  );
  const [eventRows] = await db.query<LastEventRow[]>(
    `
    SELECT tipo_evento, fecha_hora, nivel
    FROM log_maquina
    WHERE id_lavanderia = :idLav
    ORDER BY fecha_hora DESC
    LIMIT 1
    `,
    { idLav },
  );

  const summary = summaryRows[0];
  const ultimo = eventRows[0] ?? null;
  res.json({
    ok: true,
    resumen: {
      maquinas_total: Number(summary?.maquinas_total ?? 0),
      maquinas_activas: Number(summary?.maquinas_activas ?? 0),
      ciclos_hoy: Number(cycleRows[0]?.ciclos_hoy ?? 0),
      ultimo_evento: ultimo
        ? { tipo_evento: ultimo.tipo_evento, nivel: ultimo.nivel, fecha_hora: ultimo.fecha_hora }
        : null,
    },
  });
});

dashboardRouter.get("/tiempo-real", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT codigo_visible, tipo_maquina, estado_actual, activa
    FROM maquina
    WHERE id_lavanderia = :idLav
    ORDER BY codigo_visible ASC
    `,
    { idLav },
  );
  res.json({ ok: true, estado: { maquinas: rows } });
});
