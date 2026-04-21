import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { env } from "../../system/env.js";
import { db } from "../../db/pool.js";
import type { ResultSetHeader } from "mysql2/promise";
import { verifyToken } from "../auth/token.js";

export const cameraRouter = Router();

function cameraConfigured() {
  return Boolean(env.camera.baseUrl && env.camera.user && env.camera.pass);
}

function basicAuthHeader() {
  const token = Buffer.from(`${env.camera.user}:${env.camera.pass}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildUrl(path: string) {
  const base = env.camera.baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), ms);
  try {
    const fetchPromise = fetch(url, {
      headers: { authorization: basicAuthHeader() },
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

cameraRouter.get("/ptz/status", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  if (!cameraConfigured()) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const url = buildUrl("/control/click.cgi?query");
  const fr = await fetchWithTimeout(url, 5000);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/ptz/center", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  if (!cameraConfigured()) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });
  const url = buildUrl("/control/click.cgi?center");
  const fr = await fetchWithTimeout(url, 5000);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  await audit(req, "CAMERA_PTZ_CENTER", "Centrar cámara (PTZ)");
  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/zoom", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  if (!cameraConfigured()) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const mode = String(req.body?.mode ?? "");
  const value = Number(req.body?.value);
  if (!Number.isFinite(value)) return res.status(400).json({ ok: false, error: "BAD_VALUE" });
  if (mode !== "absolute" && mode !== "relative") return res.status(400).json({ ok: false, error: "BAD_MODE" });

  let url: string;
  if (mode === "absolute") {
    const v = clamp(Math.trunc(value), 1000, 8000);
    url = buildUrl(`/control/click.cgi?zoom=${v}`);
    await audit(req, "CAMERA_ZOOM_ABS", `Zoom absoluto: ${v}`);
  } else {
    const v = clamp(Math.trunc(value), -1000, 1000);
    url = buildUrl(`/control/click.cgi?zoomrel=${v}`);
    await audit(req, "CAMERA_ZOOM_REL", `Zoom relativo: ${v}`);
  }

  const fr = await fetchWithTimeout(url, 5000);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

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

    if (!cameraConfigured()) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

    // Snapshot (JPEG). La UI lo refresca cada X ms para simular "vídeo".
    const url = buildUrl("/record/current.jpg");
    const fr = await fetchWithTimeout(url, 5000);
    if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
    const r = fr.response;
    if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

    const contentType = r.headers.get("content-type") || "image/jpeg";
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch {
    return res.status(500).json({ ok: false, error: "CAMERA_PROXY_ERROR" });
  }
});
