import { Router } from "express";
import { db } from "../../db/pool.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";

export const configuracionRouter = Router();

type ConfigRow = RowDataPacket & {
  valor: string;
};

type EnvSettings = {
  CAMERA_BASE_URL: string;
  CAMERA_USER: string;
  CAMERA_PASS: string;
  MQTT_URL: string;
};

async function getConfigLav<T>(idLav: number, clave: string, fallback: T): Promise<T> {
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT valor
    FROM configuracion
    WHERE ambito = 'LAVANDERIA' AND id_lavanderia = :idLav AND clave = :clave
    LIMIT 1
    `,
    { idLav, clave },
  );
  const raw = rows[0]?.valor;
  if (!raw) return fallback;
  try {
    return (JSON.parse(raw) ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function setConfigLav(idLav: number, clave: string, valor: unknown, descripcion: string) {
  await db.query<ResultSetHeader>(
    `
    INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
    VALUES ('LAVANDERIA', :idLav, :clave, :valor, :descripcion)
    ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion)
    `,
    { idLav, clave, valor: JSON.stringify(valor), descripcion },
  );
}

configuracionRouter.get("/", requireAuth, (_req, res) => {
  res.json({ ok: true, configuracion: [] });
});

configuracionRouter.get("/env", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const envCfg = await getConfigLav<EnvSettings>(idLav, "env_settings", {
    CAMERA_BASE_URL: "",
    CAMERA_USER: "",
    CAMERA_PASS: "",
    MQTT_URL: "",
  });
  res.json({ ok: true, env: envCfg });
});

configuracionRouter.put("/env", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const envCfg: EnvSettings = {
    CAMERA_BASE_URL: String(req.body?.CAMERA_BASE_URL ?? "").trim(),
    CAMERA_USER: String(req.body?.CAMERA_USER ?? "").trim(),
    CAMERA_PASS: String(req.body?.CAMERA_PASS ?? ""),
    MQTT_URL: String(req.body?.MQTT_URL ?? "").trim(),
  };
  await setConfigLav(idLav, "env_settings", envCfg, "Ajustes ENV por tienda (demo/admin)");
  res.json({ ok: true, env: envCfg, note: "MQTT_URL requiere reinicio para aplicar bridge." });
});

configuracionRouter.put("/:clave", requireAuth, (req, res) => {
  res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED", clave: req.params.clave, body: req.body });
});
