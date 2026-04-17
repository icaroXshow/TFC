import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./token.js";

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

export function requireLavanderia(req: Request, res: Response, next: NextFunction) {
  const raw = req.header("x-lavanderia-id");
  if (!raw) {
    req.auth = { ...(req.auth ?? { id_usuario: "0", rol: "ANON" }), id_lavanderia: 1 };
    return next();
  }
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: "BAD_LAVANDERIA" });
  }
  req.auth = { ...(req.auth ?? { id_usuario: "0", rol: "ANON" }), id_lavanderia: id };
  return next();
}
