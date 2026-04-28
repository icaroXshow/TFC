import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const tiendaRouter = Router();

tiendaRouter.post("/abrir", requireAuth, (_req, res) => {
  res.status(410).json({
    ok: false,
    error: "ENDPOINT_DEPRECATED",
    message: "Usar /api/iot/store/open",
    endpoint: "/api/iot/store/open",
  });
});

tiendaRouter.post("/cerrar", requireAuth, (_req, res) => {
  res.status(410).json({
    ok: false,
    error: "ENDPOINT_DEPRECATED",
    message: "Usar /api/iot/store/close",
    endpoint: "/api/iot/store/close",
  });
});
