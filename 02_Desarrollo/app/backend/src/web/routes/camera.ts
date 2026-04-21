import { Router } from "express";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { env } from "../../system/env.js";
import { db } from "../../db/pool.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { verifyToken } from "../auth/token.js";

export const cameraRouter = Router();

type CameraConfig = { baseUrl: string; user: string; pass: string };
type ConfigRow = RowDataPacket & { valor: string };
type LavAccessRow = RowDataPacket & { id_lavanderia: number };

async function resolveCameraConfig(cam: 1 | 2, idLav: number): Promise<CameraConfig> {
  const fallback: CameraConfig =
    cam === 2
      ? { baseUrl: env.camera.baseUrl2, user: env.camera.user2, pass: env.camera.pass2 }
      : { baseUrl: env.camera.baseUrl, user: env.camera.user, pass: env.camera.pass };
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT valor
    FROM configuracion
    WHERE ambito = 'LAVANDERIA' AND id_lavanderia = :idLav AND clave = 'env_settings'
    LIMIT 1
    `,
    { idLav },
  );
  const raw = rows[0]?.valor;
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as any;
    return {
      baseUrl: String(parsed?.CAMERA_BASE_URL || fallback.baseUrl || ""),
      user: String(parsed?.CAMERA_USER || fallback.user || ""),
      pass: String(parsed?.CAMERA_PASS || fallback.pass || ""),
    };
  } catch {
    return fallback;
  }
}

function resolveCamByLav(idLav: number): 1 | 2 {
  return idLav === 2 ? 2 : 1;
}

async function userHasLavAccess(idUsuario: number, idLav: number): Promise<boolean> {
  const [rows] = await db.query<LavAccessRow[]>(
    "SELECT id_lavanderia FROM usuario_lavanderia WHERE id_usuario = :idUsuario AND id_lavanderia = :idLav LIMIT 1",
    { idUsuario, idLav },
  );
  return Boolean(rows[0]);
}

function cameraConfigured(cfg: CameraConfig) {
  return Boolean(cfg.baseUrl && cfg.user && cfg.pass);
}

function basicAuthHeader(cfg: CameraConfig) {
  const token = Buffer.from(`${cfg.user}:${cfg.pass}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildUrl(path: string, cfg: CameraConfig) {
  const base = cfg.baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchWithTimeout(url: string, ms: number, cfg: CameraConfig) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), ms);
  try {
    const fetchPromise = fetch(url, {
      headers: { authorization: basicAuthHeader(cfg) },
      signal: controller.signal,
    }).then((r) => ({ ok: true as const, response: r }));

    const timeoutPromise = new Promise<{ ok: false; error: unknown }>((resolve) =>
      setTimeout(() => resolve({ ok: false as const, error: new Error("timeout") }), ms),
    );

    return (await Promise.race([fetchPromise, timeoutPromise])) as any;
  } catch (e) {
    return { ok: false as const, error: e };
  } finally {
    clearTimeout(timer);
  }
}

async function audit(req: any, accion: string, detalle: string) {
  const idUsuario = Number(req.auth?.id_usuario ?? "0") || 1;
  const idLav = Number(req.auth?.id_lavanderia ?? 1) || 1;
  await db.query<ResultSetHeader>(
    `
    INSERT INTO auditoria (
      id_usuario, id_lavanderia, id_maquina, id_ciclo,
      fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
    ) VALUES (
      :idUsuario, :idLav, NULL, NULL,
      NOW(), :accion, 'camera', NULL, :detalle, :ip
    )
    `,
    { idUsuario, idLav, accion, detalle, ip: req.ip ?? null },
  );
}

cameraRouter.get("/ptz/status", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = resolveCamByLav(idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const url = buildUrl("/control/click.cgi?query", cfg);
  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/ptz/center", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = resolveCamByLav(idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });
  const url = buildUrl("/control/click.cgi?center=yes", cfg);
  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  await audit(req, "CAMERA_PTZ_CENTER", "Centrar cámara (PTZ)");
  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/zoom", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = resolveCamByLav(idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const mode = String(req.body?.mode ?? "");
  const value = Number(req.body?.value);
  if (!Number.isFinite(value)) return res.status(400).json({ ok: false, error: "BAD_VALUE" });
  if (mode !== "absolute" && mode !== "relative") return res.status(400).json({ ok: false, error: "BAD_MODE" });

  let url: string;
  if (mode === "absolute") {
    const v = clamp(Math.trunc(value), 1000, 8000);
    url = buildUrl(`/control/click.cgi?zoom=${v}`, cfg);
    await audit(req, "CAMERA_ZOOM_ABS", `Zoom absoluto: ${v}`);
  } else {
    const v = clamp(Math.trunc(value), -1000, 1000);
    url = buildUrl(`/control/click.cgi?zoomrel=${v}`, cfg);
    await audit(req, "CAMERA_ZOOM_REL", `Zoom relativo: ${v}`);
  }

  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/audio/play", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = resolveCamByLav(idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });
  const soundfile = String(req.body?.soundfile ?? "PUBLICIDAD").trim();
  if (!/^[A-Za-z0-9_]{1,40}$/.test(soundfile)) return res.status(400).json({ ok: false, error: "BAD_SOUNDFILE" });
  const url = buildUrl(`/control/rcontrol?action=sound&soundfile=${encodeURIComponent(soundfile)}`, cfg);
  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });
  await audit(req, "CAMERA_AUDIO_PLAY", `Audio reproducido: ${soundfile}`);
  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/relay/pulse", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = resolveCamByLav(idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const kind = String(req.body?.kind ?? "").trim().toLowerCase();
  let outmask = "";
  let time = "";
  if (kind === "door" || kind === "puerta") {
    outmask = "0x2";
    time = "3";
  } else if (kind === "lights" || kind === "luces") {
    outmask = "0x1";
    time = "1";
  } else {
    return res.status(400).json({ ok: false, error: "BAD_KIND" });
  }

  const url = buildUrl(`/control/rcontrol?action=sigouthigh&time=${time}&outmask=${encodeURIComponent(outmask)}`, cfg);
  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  await audit(req, "CAMERA_RELAY_PULSE", `Pulso relé ${kind} (outmask=${outmask},time=${time})`);
  return res.json({ ok: true, raw: text });
});

// Stream proxy (no expone credenciales). Image tag friendly.
cameraRouter.get("/stream.jpg", async (req, res) => {
  try {
    // Para <img>, el navegador no envía Authorization.
    // Aceptamos token en query string: /stream.jpg?t=<token>
    const header = req.header("authorization") ?? "";
    const m = header.match(/^Bearer\s+(.+)$/i);
    const token = (m?.[1] ?? String(req.query?.t ?? "")).trim();
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.rol !== "ADMIN") {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }

    const lav = Number(req.query?.lav ?? "1");
    const idUsuario = Number(payload.sub ?? "0");
    if (!Number.isFinite(lav) || lav <= 0) return res.status(400).json({ ok: false, error: "BAD_LAVANDERIA" });
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    const hasAccess = await userHasLavAccess(idUsuario, lav);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });

    const cam = String(req.query?.cam ?? "") ? (String(req.query?.cam) === "2" ? 2 : 1) : resolveCamByLav(lav);
    const cfg = await resolveCameraConfig(cam, lav);
    if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

    const candidates = [
      `/control/faststream.jpg?stream=full&fps=16&rand=${Date.now()}`,
      `/record/current.jpg?rand=${Date.now()}`,
    ];
    let r: Response | null = null;
    for (const path of candidates) {
      const fr = await fetchWithTimeout(buildUrl(path, cfg), 8000, cfg);
      if (fr.ok && fr.response.ok) {
        r = fr.response;
        break;
      }
    }
    if (!r) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

    const contentType = r.headers.get("content-type") || "image/jpeg";
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch {
    return res.status(500).json({ ok: false, error: "CAMERA_PROXY_ERROR" });
  }
});
