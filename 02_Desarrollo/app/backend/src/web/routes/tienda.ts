import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const tiendaRouter = Router();

tiendaRouter.post("/abrir", requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
});

tiendaRouter.post("/cerrar", requireAuth, (_req, res) => {
  res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
});

