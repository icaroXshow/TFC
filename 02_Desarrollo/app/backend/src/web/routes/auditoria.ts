import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { requireAuth, requireLavanderia } from "../auth/middleware.js";
import { db } from "../../db/pool.js";

export const auditoriaRouter = Router();

type AuditoriaRow = RowDataPacket & {
  id_auditoria: number;
  fecha_hora: string;
  accion: string;
  entidad_afectada: string | null;
  detalle: string | null;
  ip_origen: string | null;
  id_usuario: number | null;
  id_maquina: number | null;
  usuario_login: string | null;
  maquina_codigo: string | null;
};

auditoriaRouter.get("/", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 0);
  const limitRaw = Number(req.query?.limit ?? 100);
  const offsetRaw = Number(req.query?.offset ?? 0);
  const q = String(req.query?.q ?? "").trim();
  const accion = String(req.query?.accion ?? "").trim();

  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

  const where = ["a.id_lavanderia = :idLav"];
  const params: Record<string, string | number> = { idLav, limit, offset };

  if (accion) {
    where.push("a.accion = :accion");
    params.accion = accion;
  }
  if (q) {
    where.push("(a.detalle LIKE :q OR a.accion LIKE :q OR COALESCE(u.login,'') LIKE :q OR COALESCE(m.codigo_visible,'') LIKE :q)");
    params.q = `%${q}%`;
  }

  const sql = `
    SELECT
      a.id_auditoria,
      a.fecha_hora,
      a.accion,
      a.entidad_afectada,
      a.detalle,
      a.ip_origen,
      a.id_usuario,
      a.id_maquina,
      u.login AS usuario_login,
      m.codigo_visible AS maquina_codigo
    FROM auditoria a
    LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
    LEFT JOIN maquina m ON m.id_maquina = a.id_maquina
    WHERE ${where.join(" AND ")}
    ORDER BY a.fecha_hora DESC, a.id_auditoria DESC
    LIMIT :limit OFFSET :offset
  `;

  const [rows] = await db.query<AuditoriaRow[]>(sql, params);
  res.json({ ok: true, items: rows, limit, offset });
});
