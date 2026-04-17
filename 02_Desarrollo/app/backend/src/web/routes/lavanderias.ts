import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { db } from "../../db/pool.js";
import type { RowDataPacket } from "mysql2";

type LavanderiaRow = RowDataPacket & {
  id_lavanderia: number;
  nombre: string;
  codigo: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  activo: 0 | 1;
};

export const lavanderiasRouter = Router();

lavanderiasRouter.get("/", requireAuth, async (req, res) => {
  const idUsuario = Number(req.auth?.id_usuario ?? "0");
  if (!idUsuario) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

  const [rows] = await db.query<LavanderiaRow[]>(
    `
    SELECT l.id_lavanderia, l.nombre, l.codigo, l.direccion, l.ciudad, l.provincia, l.activo
    FROM usuario_lavanderia ul
    JOIN lavanderia l ON l.id_lavanderia = ul.id_lavanderia
    WHERE ul.id_usuario = :idUsuario
    ORDER BY l.nombre
    `,
    { idUsuario },
  );

  res.json({ ok: true, lavanderias: rows });
});

