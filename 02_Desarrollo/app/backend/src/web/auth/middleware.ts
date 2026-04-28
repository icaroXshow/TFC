import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./token.js";
import { db } from "../../db/pool.js";
import type { RowDataPacket } from "mysql2/promise";

export type AuthUser = {
  id_usuario: string;
  rol: string;
  id_lavanderia?: number;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

  const payload = verifyToken(m[1]);
  if (!payload) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

  req.auth = { id_usuario: payload.sub, rol: payload.rol };
  return next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rol = req.auth?.rol;
    if (!rol) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    if (!roles.includes(rol)) return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    return next();
  };
}

type LavAccessRow = RowDataPacket & { id_lavanderia: number };

export async function requireLavanderia(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.auth?.id_usuario ?? "0");
    if (!userId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const raw = req.header("x-lavanderia-id");
    if (!raw) {
      const [rows] = await db.query<LavAccessRow[]>(
        "SELECT id_lavanderia FROM usuario_lavanderia WHERE id_usuario = :idUsuario ORDER BY id_lavanderia ASC",
        { idUsuario: userId },
      );
      if (!rows.length) return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });
      if (rows.length > 1) {
        return res.status(400).json({
          ok: false,
          error: "LAVANDERIA_REQUIRED",
          message: "Selecciona lavandería explícitamente con x-lavanderia-id",
        });
      }
      const first = rows[0]?.id_lavanderia;
      req.auth = { ...(req.auth ?? { id_usuario: "0", rol: "ANON" }), id_lavanderia: first };
      return next();
    }
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_LAVANDERIA" });
    }

    const [allowed] = await db.query<LavAccessRow[]>(
      "SELECT id_lavanderia FROM usuario_lavanderia WHERE id_usuario = :idUsuario AND id_lavanderia = :idLav LIMIT 1",
      { idUsuario: userId, idLav: id },
    );
    if (!allowed[0]) return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });

    req.auth = { ...(req.auth ?? { id_usuario: "0", rol: "ANON" }), id_lavanderia: id };
    return next();
  } catch {
    return res.status(503).json({ ok: false, error: "DB_UNAVAILABLE" });
  }
}
