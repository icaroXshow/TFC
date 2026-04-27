import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const tiendaRouter = Router();

tiendaRouter.post("/abrir", requireAuth, (_req, res) => {
  res.status(308).json({ ok: false, error: "ENDPOINT_MOVED", endpoint: "/api/iot/store/open" });
});

tiendaRouter.post("/cerrar", requireAuth, (_req, res) => {
  res.status(308).json({ ok: false, error: "ENDPOINT_MOVED", endpoint: "/api/iot/store/close" });
});
