import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia } from "../auth/middleware.js";

export const cajaRouter = Router();

type CajaRow = RowDataPacket & {
  id_maquina: number;
  codigo_visible: string;
  tipo_maquina: string;
  importe_total: string; // mysql2 devuelve DECIMAL como string
  movimientos: number;
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

async function computeCaja(idLav: number, from: string, to: string) {
  const [rows] = await db.query<CajaRow[]>(
    `
    SELECT
      m.id_maquina,
      m.codigo_visible,
      m.tipo_maquina,
      CAST(SUM(CASE WHEN mm.es_bonificacion = 1 THEN -mm.importe ELSE mm.importe END) AS CHAR) AS importe_total,
      COUNT(*) AS movimientos
    FROM movimiento_maquina mm
    INNER JOIN maquina m ON m.id_maquina = mm.id_maquina
    WHERE mm.id_lavanderia = :idLav
      AND mm.fecha_hora >= :from
      AND mm.fecha_hora < DATE_ADD(:to, INTERVAL 1 DAY)
    GROUP BY m.id_maquina, m.codigo_visible, m.tipo_maquina
    ORDER BY m.codigo_visible ASC
    `,
    { idLav, from, to },
  );

  const items = rows.map((r) => ({
    id_maquina: r.id_maquina,
    codigo_visible: r.codigo_visible,
    tipo_maquina: r.tipo_maquina,
    importe_total: Number(r.importe_total ?? "0"),
    movimientos: Number(r.movimientos ?? 0),
  }));

  const total = items.reduce((acc, it) => acc + (Number.isFinite(it.importe_total) ? it.importe_total : 0), 0);
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
