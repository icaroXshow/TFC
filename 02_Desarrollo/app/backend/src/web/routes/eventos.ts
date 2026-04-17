import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const eventosRouter = Router();

eventosRouter.get("/", requireAuth, (_req, res) => {
  res.json({ ok: true, eventos: [] });
});

