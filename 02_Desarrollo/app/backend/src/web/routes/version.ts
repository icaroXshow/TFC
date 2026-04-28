import { Router } from "express";

export const versionRouter = Router();

versionRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "kwl-backend",
    build_time: new Date().toISOString(),
    frontend_cache_hint: "Usar querystring de versión en assets JS/CSS tras cambios",
  });
});
