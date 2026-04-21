import { Router } from "express";
import { env } from "../../system/env.js";
import { issueToken } from "../auth/token.js";
import { requireAuth } from "../auth/middleware.js";
import { db } from "../../db/pool.js";
import type { UsuarioRow } from "../../db/types.js";
import { verifyPassword } from "../auth/password.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const login = String(req.body?.email ?? req.body?.login ?? "");
  const password = String(req.body?.password ?? "");

  if (!login || !password) {
    return res.status(400).json({ ok: false, error: "BAD_REQUEST" });
  }

  const [rows] = await db.query<UsuarioRow[]>(
    "SELECT * FROM usuario WHERE login = :login LIMIT 1",
    { login },
  );
  const user = rows[0];
  if (!user || user.activo !== 1) {
    return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

  const token = issueToken({ sub: String(user.id_usuario), rol: user.rol }, 60 * 60);
  return res.json({
    ok: true,
    token,
    user: { id_usuario: user.id_usuario, login: user.login, rol: user.rol },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.auth });
});
