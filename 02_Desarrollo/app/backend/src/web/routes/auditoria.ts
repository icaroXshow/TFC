import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const auditoriaRouter = Router();

auditoriaRouter.get("/", requireAuth, (_req, res) => {
  res.json({ ok: true, auditoria: [] });
});

