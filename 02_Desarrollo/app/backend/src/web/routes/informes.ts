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
  importe_total_aplicado: string;
  duracion_total_programada_min: number;
};

type MachineAggRow = RowDataPacket & {
  id_maquina: number;
  codigo_visible: string;
  total: string;
  ciclos: number;
};

type TimeSlotAggRow = RowDataPacket & {
  slot_key: string;
  id_maquina: number;
  codigo_visible: string;
  total: string;
  ciclos: number;
};

function isDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isMonthYYYYMM(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}

function isYearYYYY(s: string) {
  return /^\d{4}$/.test(s);
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthYYYYMM() {
  return todayYYYYMMDD().slice(0, 7);
}

function yearYYYY() {
  return todayYYYYMMDD().slice(0, 4);
}

function isoWeekFromDate(s: string) {
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toNum(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function prevMonth(yyyymm: string) {
  const [yRaw, mRaw] = yyyymm.split("-");
  let y = Number(yRaw);
  let m = Number(mRaw);
  m -= 1;
  if (m <= 0) {
    y -= 1;
    m = 12;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
}

function prevYear(yyyy: string) {
  return String(Number(yyyy) - 1);
}

async function loadMachineCompareByCondition(
  idLav: number,
  currentWhere: string,
  prevWhere: string,
  params: Record<string, unknown>,
) {
  const [rows] = await db.query<MachineAggRow[]>(
    `
    SELECT
      m.id_maquina,
      m.codigo_visible,
      CAST(SUM(CASE WHEN ${currentWhere} THEN c.importe_total_aplicado ELSE 0 END) AS CHAR) AS total,
      SUM(CASE WHEN ${currentWhere} THEN 1 ELSE 0 END) AS ciclos,
      CAST(SUM(CASE WHEN ${prevWhere} THEN c.importe_total_aplicado ELSE 0 END) AS CHAR) AS total_prev,
      SUM(CASE WHEN ${prevWhere} THEN 1 ELSE 0 END) AS ciclos_prev
    FROM maquina m
    LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina
    WHERE m.id_lavanderia = :idLav
    GROUP BY m.id_maquina, m.codigo_visible
    ORDER BY m.codigo_visible
    `,
    { idLav, ...params },
  );

  const machines = rows.map((r: any) => ({
    id_maquina: r.id_maquina,
    codigo_visible: r.codigo_visible,
    total_actual: toNum(r.total),
    ciclos_actual: toNum(r.ciclos),
    total_anterior: toNum(r.total_prev),
    ciclos_anterior: toNum(r.ciclos_prev),
    delta_total: toNum(r.total) - toNum(r.total_prev),
    delta_ciclos: toNum(r.ciclos) - toNum(r.ciclos_prev),
  }));

  const resumen = machines.reduce(
    (acc, m) => {
      acc.total_actual += m.total_actual;
      acc.total_anterior += m.total_anterior;
      acc.ciclos_actual += m.ciclos_actual;
      acc.ciclos_anterior += m.ciclos_anterior;
      return acc;
    },
    { total_actual: 0, total_anterior: 0, ciclos_actual: 0, ciclos_anterior: 0 },
  );

  return {
    resumen: {
      ...resumen,
      delta_total: resumen.total_actual - resumen.total_anterior,
      delta_ciclos: resumen.ciclos_actual - resumen.ciclos_anterior,
    },
    machines,
  };
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

informesRouter.get("/evolucion/semanal", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const date = String(req.query?.date ?? todayYYYYMMDD()).trim();
  if (!isDateYYYYMMDD(date)) return res.status(400).json({ ok: false, error: "BAD_DATE" });

  const compare = await loadMachineCompareByCondition(
    idLav,
    "YEARWEEK(c.fecha_hora_inicio, 3) = YEARWEEK(:date, 3)",
    "YEARWEEK(c.fecha_hora_inicio, 3) = YEARWEEK(DATE_SUB(:date, INTERVAL 7 DAY), 3)",
    { date },
  );

  res.json({
    ok: true,
    tipo: "semanal",
    periodo_actual: isoWeekFromDate(date),
    periodo_anterior: isoWeekFromDate(String(new Date(new Date(`${date}T00:00:00Z`).getTime() - 7 * 86400000).toISOString().slice(0, 10))),
    ...compare,
  });
});

informesRouter.get("/evolucion/mensual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const month = String(req.query?.month ?? monthYYYYMM()).trim();
  if (!isMonthYYYYMM(month)) return res.status(400).json({ ok: false, error: "BAD_MONTH" });
  const p = prevMonth(month);

  const compare = await loadMachineCompareByCondition(
    idLav,
    "DATE_FORMAT(c.fecha_hora_inicio, '%Y-%m') = :month",
    "DATE_FORMAT(c.fecha_hora_inicio, '%Y-%m') = :prevMonth",
    { month, prevMonth: p },
  );

  res.json({ ok: true, tipo: "mensual", periodo_actual: month, periodo_anterior: p, ...compare });
});

informesRouter.get("/evolucion/anual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const year = String(req.query?.year ?? yearYYYY()).trim();
  if (!isYearYYYY(year)) return res.status(400).json({ ok: false, error: "BAD_YEAR" });
  const yPrev = prevYear(year);

  const compare = await loadMachineCompareByCondition(
    idLav,
    "YEAR(c.fecha_hora_inicio) = :year",
    "YEAR(c.fecha_hora_inicio) = :prevYear",
    { year, prevYear: yPrev },
  );

  res.json({ ok: true, tipo: "anual", periodo_actual: year, periodo_anterior: yPrev, ...compare });
});

async function getMachineColumns(idLav: number) {
  const [machines] = await db.query<(RowDataPacket & { id_maquina: number; codigo_visible: string })[]>(
    `
    SELECT id_maquina, codigo_visible
    FROM maquina
    WHERE id_lavanderia = :idLav
    ORDER BY codigo_visible
    `,
    { idLav },
  );
  return machines;
}

function buildMatrix(slots: string[], machines: Array<{ id_maquina: number; codigo_visible: string }>, rows: TimeSlotAggRow[]) {
  const map = new Map<string, { total: number; ciclos: number }>();
  rows.forEach((r) => map.set(`${r.slot_key}:${r.id_maquina}`, { total: toNum(r.total), ciclos: toNum(r.ciclos) }));

  const data = slots.map((slot) => {
    const mvals = machines.map((m) => {
      const cell = map.get(`${slot}:${m.id_maquina}`) ?? { total: 0, ciclos: 0 };
      return { id_maquina: m.id_maquina, codigo_visible: m.codigo_visible, total: cell.total, ciclos: cell.ciclos };
    });
    const total_slot = mvals.reduce((a, v) => a + v.total, 0);
    const ciclos_slot = mvals.reduce((a, v) => a + v.ciclos, 0);
    return { slot, maquinas: mvals, total_slot, ciclos_slot };
  });

  const totals_by_machine = machines.map((m) => {
    let total = 0;
    let ciclos = 0;
    data.forEach((row) => {
      const cell = row.maquinas.find((x) => x.id_maquina === m.id_maquina);
      total += toNum(cell?.total);
      ciclos += toNum(cell?.ciclos);
    });
    return { id_maquina: m.id_maquina, codigo_visible: m.codigo_visible, total, ciclos };
  });

  const total_general = totals_by_machine.reduce((a, v) => a + v.total, 0);
  const ciclos_general = totals_by_machine.reduce((a, v) => a + v.ciclos, 0);

  return { data, totals_by_machine, total_general, ciclos_general };
}

informesRouter.get("/tramos/diario", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const date = String(req.query?.date ?? todayYYYYMMDD()).trim();
  if (!isDateYYYYMMDD(date)) return res.status(400).json({ ok: false, error: "BAD_DATE" });

  const machines = await getMachineColumns(idLav);
  const slots = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

  const [rows] = await db.query<TimeSlotAggRow[]>(
    `
    SELECT
      LPAD(HOUR(c.fecha_hora_inicio), 2, '0') AS slot_key,
      m.id_maquina,
      m.codigo_visible,
      CAST(SUM(c.importe_total_aplicado) AS CHAR) AS total,
      COUNT(*) AS ciclos
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE m.id_lavanderia = :idLav
      AND DATE(c.fecha_hora_inicio) = :date
    GROUP BY slot_key, m.id_maquina, m.codigo_visible
    ORDER BY slot_key, m.codigo_visible
    `,
    { idLav, date },
  );

  const matrix = buildMatrix(slots, machines, rows);
  res.json({ ok: true, tipo: "diario", periodo: date, ...matrix });
});

informesRouter.get("/tramos/mensual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const month = String(req.query?.month ?? monthYYYYMM()).trim();
  if (!isMonthYYYYMM(month)) return res.status(400).json({ ok: false, error: "BAD_MONTH" });

  const machines = await getMachineColumns(idLav);
  const [daysRows] = await db.query<RowDataPacket[]>(
    "SELECT DAY(LAST_DAY(CONCAT(:month, '-01'))) AS d",
    { month },
  );
  const maxDay = Number(daysRows?.[0]?.d ?? 30);
  const slots = Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, "0"));

  const [rows] = await db.query<TimeSlotAggRow[]>(
    `
    SELECT
      LPAD(DAY(c.fecha_hora_inicio), 2, '0') AS slot_key,
      m.id_maquina,
      m.codigo_visible,
      CAST(SUM(c.importe_total_aplicado) AS CHAR) AS total,
      COUNT(*) AS ciclos
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE m.id_lavanderia = :idLav
      AND DATE_FORMAT(c.fecha_hora_inicio, '%Y-%m') = :month
    GROUP BY slot_key, m.id_maquina, m.codigo_visible
    ORDER BY slot_key, m.codigo_visible
    `,
    { idLav, month },
  );

  const matrix = buildMatrix(slots, machines, rows);
  res.json({ ok: true, tipo: "mensual", periodo: month, ...matrix });
});

informesRouter.get("/tramos/anual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const year = String(req.query?.year ?? yearYYYY()).trim();
  if (!isYearYYYY(year)) return res.status(400).json({ ok: false, error: "BAD_YEAR" });

  const machines = await getMachineColumns(idLav);
  const slots = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const [rows] = await db.query<TimeSlotAggRow[]>(
    `
    SELECT
      LPAD(MONTH(c.fecha_hora_inicio), 2, '0') AS slot_key,
      m.id_maquina,
      m.codigo_visible,
      CAST(SUM(c.importe_total_aplicado) AS CHAR) AS total,
      COUNT(*) AS ciclos
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE m.id_lavanderia = :idLav
      AND YEAR(c.fecha_hora_inicio) = :year
    GROUP BY slot_key, m.id_maquina, m.codigo_visible
    ORDER BY slot_key, m.codigo_visible
    `,
    { idLav, year },
  );

  const matrix = buildMatrix(slots, machines, rows);
  res.json({ ok: true, tipo: "anual", periodo: year, ...matrix });
});
