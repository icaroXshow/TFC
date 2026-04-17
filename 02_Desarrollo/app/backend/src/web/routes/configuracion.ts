import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const configuracionRouter = Router();

configuracionRouter.get("/", requireAuth, (_req, res) => {
  res.json({ ok: true, configuracion: [] });
});

configuracionRouter.put("/:clave", requireAuth, (req, res) => {
  res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED", clave: req.params.clave, body: req.body });
});

