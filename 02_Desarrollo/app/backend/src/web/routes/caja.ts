import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia } from "../auth/middleware.js";

export const cajaRouter = Router();

type CajaRow = RowDataPacket & {
  id_maquina: number;
  codigo_visible: string;
  tipo_maquina: string;
  importe: string;
  abonado: string;
  total: string;
  movimientos: number;
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

function startOfWeekMonday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  // JS: 0=domingo, 1=lunes... queremos lunes
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function monthBounds(month: string) {
  const from = `${month}-01`;
  const d = new Date(`${from}T00:00:00`);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from, to };
}

async function computeCaja(idLav: number, from: string, to: string) {
  const [rows] = await db.query<CajaRow[]>(
    `
    SELECT
      m.id_maquina,
      m.codigo_visible,
      m.tipo_maquina,
      CAST(SUM(COALESCE(c.importe_total_aplicado, 0)) AS CHAR) AS importe,
      CAST(SUM(COALESCE(c.importe_bonificado_total, 0)) AS CHAR) AS abonado,
      CAST(SUM(GREATEST(0, COALESCE(c.importe_total_aplicado, 0) - COALESCE(c.importe_bonificado_total, 0))) AS CHAR) AS total,
      COUNT(*) AS movimientos
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE c.estado_ciclo IN ('INICIADO','FINALIZADO')
      AND m.id_lavanderia = :idLav
      AND c.fecha_hora_inicio >= :from
      AND c.fecha_hora_inicio < DATE_ADD(:to, INTERVAL 1 DAY)
    GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
    ORDER BY m.codigo_visible ASC
    `,
    { idLav, from, to },
  );

  const items = rows.map((r) => ({
    id_maquina: r.id_maquina,
    codigo_visible: r.codigo_visible,
    tipo_maquina: r.tipo_maquina,
    importe: Number(r.importe ?? "0"),
    abonado: Number(r.abonado ?? "0"),
    total: Number(r.total ?? "0"),
    movimientos: Number(r.movimientos ?? 0),
  }));

  const total = items.reduce((acc, it) => acc + (Number.isFinite(it.total) ? it.total : 0), 0);
  const movimientos = items.reduce((acc, it) => acc + (Number.isFinite(it.movimientos) ? it.movimientos : 0), 0);

  return { items, total, movimientos };
}

cajaRouter.get("/dia", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const date = String(req.query?.date ?? todayYYYYMMDD()).trim();
  if (!isDateYYYYMMDD(date)) return res.status(400).json({ ok: false, error: "BAD_DATE" });

  const { items, total, movimientos } = await computeCaja(idLav, date, date);
  res.json({ ok: true, mode: "dia", from: date, to: date, total, movimientos, items });
});

cajaRouter.get("/semana", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const date = String(req.query?.date ?? todayYYYYMMDD()).trim();
  if (!isDateYYYYMMDD(date)) return res.status(400).json({ ok: false, error: "BAD_DATE" });

  const from = startOfWeekMonday(date);
  const to = addDays(from, 6);
  const { items, total, movimientos } = await computeCaja(idLav, from, to);
  res.json({ ok: true, mode: "semana", from, to, total, movimientos, items });
});

cajaRouter.get("/rango", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const from = String(req.query?.from ?? "").trim();
  const to = String(req.query?.to ?? "").trim();
  if (!isDateYYYYMMDD(from) || !isDateYYYYMMDD(to)) return res.status(400).json({ ok: false, error: "BAD_RANGE" });
  if (from > to) return res.status(400).json({ ok: false, error: "RANGE_ORDER" });

  const { items, total, movimientos } = await computeCaja(idLav, from, to);
  res.json({ ok: true, mode: "rango", from, to, total, movimientos, items });
});

cajaRouter.get("/mensual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const month = String(req.query?.month ?? "").trim();
  if (!isMonthYYYYMM(month)) return res.status(400).json({ ok: false, error: "BAD_MONTH" });
  const { from, to } = monthBounds(month);
  const { items, total, movimientos } = await computeCaja(idLav, from, to);
  res.json({ ok: true, mode: "mensual", month, from, to, total, movimientos, items });
});

cajaRouter.get("/anual", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const year = String(req.query?.year ?? "").trim();
  if (!isYearYYYY(year)) return res.status(400).json({ ok: false, error: "BAD_YEAR" });
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const { items, total, movimientos } = await computeCaja(idLav, from, to);
  res.json({ ok: true, mode: "anual", year, from, to, total, movimientos, items });
});
