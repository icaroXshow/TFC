import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get("/resumen", requireAuth, (_req, res) => {
  res.json({
    ok: true,
    resumen: {
      maquinas_total: 1,
      maquinas_activas: 1,
      ciclos_hoy: 0,
      ultimo_evento: null,
    },
  });
});

dashboardRouter.get("/tiempo-real", requireAuth, (_req, res) => {
  res.json({ ok: true, estado: {} });
});

