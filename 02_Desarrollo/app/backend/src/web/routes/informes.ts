import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia } from "../auth/middleware.js";

export const informesRouter = Router();

type CicloRow = RowDataPacket & {
  id_ciclo: number;
  id_maquina: number;
  codigo_visible: string;
  tipo_maquina: string;
  fecha_hora_inicio: Date;
  fecha_hora_fin: Date | null;
  estado_ciclo: string;
  importe_total_aplicado: string; // DECIMAL -> string
  duracion_total_programada_min: number;
};

function isDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

informesRouter.get("/ciclos", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;

  const from = String(req.query?.from ?? todayYYYYMMDD()).trim();
  const to = String(req.query?.to ?? todayYYYYMMDD()).trim();
  if (!isDateYYYYMMDD(from) || !isDateYYYYMMDD(to)) return res.status(400).json({ ok: false, error: "BAD_RANGE" });
  if (from > to) return res.status(400).json({ ok: false, error: "RANGE_ORDER" });

  const idMaquina = req.query?.id_maquina ? Number(req.query.id_maquina) : null;
  if (idMaquina !== null && (!Number.isFinite(idMaquina) || idMaquina <= 0)) {
    return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
  }

  const estado = req.query?.estado ? String(req.query.estado).trim().toUpperCase() : null;
  const allowed = new Set(["INICIADO", "FINALIZADO", "CANCELADO", "INCIDENCIA"]);
  if (estado && !allowed.has(estado)) return res.status(400).json({ ok: false, error: "BAD_ESTADO" });

  const limit = clampInt(Number(req.query?.limit ?? 50), 1, 200);
  const offset = Math.max(0, Number(req.query?.offset ?? 0) || 0);

  const where: string[] = [];
  const params: Record<string, any> = { idLav, from, to, limit, offset };

  where.push("m.id_lavanderia = :idLav");
  where.push("c.fecha_hora_inicio >= :from");
  where.push("c.fecha_hora_inicio < DATE_ADD(:to, INTERVAL 1 DAY)");

  if (idMaquina) {
    where.push("c.id_maquina = :idMaquina");
    params.idMaquina = idMaquina;
  }
  if (estado) {
    where.push("c.estado_ciclo = :estado");
    params.estado = estado;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    ${whereSql}
    `,
    params,
  );
  const total = Number(countRows?.[0]?.total ?? 0);

  const [rows] = await db.query<CicloRow[]>(
    `
    SELECT
      c.id_ciclo,
      c.id_maquina,
      m.codigo_visible,
      m.tipo_maquina,
      c.fecha_hora_inicio,
      c.fecha_hora_fin,
      c.estado_ciclo,
      CAST(c.importe_total_aplicado AS CHAR) AS importe_total_aplicado,
      c.duracion_total_programada_min
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    ${whereSql}
    ORDER BY c.fecha_hora_inicio DESC
    LIMIT :limit OFFSET :offset
    `,
    params,
  );

  const ciclos = rows.map((r) => ({
    id_ciclo: r.id_ciclo,
    id_maquina: r.id_maquina,
    codigo_visible: r.codigo_visible,
    tipo_maquina: r.tipo_maquina,
    fecha_hora_inicio: r.fecha_hora_inicio,
    fecha_hora_fin: r.fecha_hora_fin,
    estado_ciclo: r.estado_ciclo,
    importe_total_aplicado: Number(r.importe_total_aplicado ?? "0"),
    duracion_total_programada_min: Number(r.duracion_total_programada_min ?? 0),
  }));

  res.json({ ok: true, total, limit, offset, from, to, ciclos });
});

