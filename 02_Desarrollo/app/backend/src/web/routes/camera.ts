import { Router } from "express";
import { Readable } from "node:stream";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { env } from "../../system/env.js";
import { db } from "../../db/pool.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { verifyToken } from "../auth/token.js";

export const cameraRouter = Router();

type CameraConfig = { baseUrl: string; user: string; pass: string };
type ConfigRow = RowDataPacket & { valor: string };
type LavAccessRow = RowDataPacket & { id_lavanderia: number };
const EMPTY_GIF = Buffer.from("R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");

async function resolveCameraConfig(cam: 1 | 2, idLav: number): Promise<CameraConfig> {
  const fallback: CameraConfig =
    cam === 2
      ? {
          baseUrl: env.camera.baseUrl2,
          user: env.camera.user2,
          pass: env.camera.pass2,
        }
      : {
          baseUrl: env.camera.baseUrl,
          user: env.camera.user,
          pass: env.camera.pass,
        };
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

async function resolveCamByLav(idLav: number): Promise<1 | 2> {
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
  if (!raw) return 1;
  try {
    const parsed = JSON.parse(raw) as { CAMERA_SLOT?: unknown; CAMERA_ID?: unknown };
    const slot = Number(parsed?.CAMERA_SLOT ?? parsed?.CAMERA_ID ?? 1);
    return slot === 2 ? 2 : 1;
  } catch {
    return 1;
  }
}

async function resolveCamFromBody(req: any, idLav: number): Promise<1 | 2> {
  const raw = Number(req.body?.cam);
  if (raw === 2) return 2;
  if (raw === 1) return 1;
  return resolveCamByLav(idLav);
}

async function userHasLavAccess(idUsuario: number, idLav: number): Promise<boolean> {
  const [rows] = await db.query<LavAccessRow[]>(
    "SELECT id_lavanderia FROM usuario_lavanderia WHERE id_usuario = :idUsuario AND id_lavanderia = :idLav LIMIT 1",
    { idUsuario, idLav },
  );
  return Boolean(rows[0]);
}

async function resolveStreamRequest(req: any) {
  const header = req.header("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  const token = (m?.[1] ?? String(req.query?.t ?? "")).trim();
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["ADMIN", "OPERADOR"].includes(String(payload.rol || "").toUpperCase())) {
    return { ok: false as const, status: 401 };
  }

  const lav = Number(req.query?.lav ?? "1");
  const idUsuario = Number(payload.sub ?? "0");
  if (!Number.isFinite(lav) || lav <= 0) return { ok: false as const, status: 400 };
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return { ok: false as const, status: 401 };
  const hasAccess = await userHasLavAccess(idUsuario, lav);
  if (!hasAccess) return { ok: false as const, status: 403 };

  const cam = String(req.query?.cam ?? "") ? (String(req.query?.cam) === "2" ? 2 : 1) : await resolveCamByLav(lav);
  const cfg = await resolveCameraConfig(cam, lav);
  if (!cameraConfigured(cfg)) return { ok: false as const, status: 503 };
  return { ok: true as const, cfg };
}

function cameraConfigured(cfg: CameraConfig) {
  return Boolean(cfg.baseUrl && cfg.user && cfg.pass);
}

function basicAuthHeader(user: string, pass: string) {
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function sendStreamFallback(res: any, status = 200) {
  res.status(200);
  res.setHeader("content-type", "image/gif");
  res.setHeader("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("pragma", "no-cache");
  res.setHeader("x-camera-fallback-status", String(status));
  return res.send(EMPTY_GIF);
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
      headers: { authorization: basicAuthHeader(cfg.user, cfg.pass) },
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
  const cam = await resolveCamFromBody(req, idLav);
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
  const cam = await resolveCamFromBody(req, idLav);
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
  const cam = await resolveCamFromBody(req, idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const mode = String(req.body?.mode ?? "");
  const value = Number(req.body?.value);
  if (!Number.isFinite(value)) return res.status(400).json({ ok: false, error: "BAD_VALUE" });
  if (mode !== "relative") return res.status(400).json({ ok: false, error: "BAD_MODE" });

  const v = clamp(Math.trunc(value), -1000, 1000);
  const url = buildUrl(`/control/click.cgi?zoomrel=${v}&dummy=${Date.now()}`, cfg);
  await audit(req, "CAMERA_ZOOM_REL", `Zoom relativo: ${v}`);

  const fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  return res.json({ ok: true, raw: text });
});

cameraRouter.post("/display-mode", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = await resolveCamFromBody(req, idLav);
  const cfg = await resolveCameraConfig(cam, idLav);
  if (!cameraConfigured(cfg)) return res.status(503).json({ ok: false, error: "CAMERA_NOT_CONFIGURED" });

  const rawMode = String(req.body?.mode ?? "surround").trim();
  const key = rawMode.toLowerCase().replace(/\s+/g, " ");
  const modeVariants: Record<string, string[]> = {
    "full image": ["0", "Full Image", "fullimage", "full image"],
    fullimage: ["0", "Full Image", "fullimage", "full image"],
    full: ["0", "Full Image", "fullimage"],
    surround: ["Surround", "surround", "2"],
    panorama: ["Panorama", "panorama", "3"],
    "0": ["Full Image", "fullimage", "0"],
    "2": ["Surround", "surround", "2"],
    "3": ["Panorama", "panorama", "3"],
  };
  const valuesToTry = modeVariants[key];
  if (!valuesToTry) return res.status(400).json({ ok: false, error: "BAD_MODE" });
  const urls: string[] = [];
  for (const value of valuesToTry) {
    urls.push(buildUrl(`/control/control?no_http_header&set&section=quickcontrol&display_mode=${encodeURIComponent(value)}`, cfg));
    urls.push(buildUrl(`/control/control?set&section=quickcontrol&display_mode=${encodeURIComponent(value)}`, cfg));
    urls.push(buildUrl(`/control/click.cgi?display_mode=${encodeURIComponent(value)}&dummy=${Date.now()}`, cfg));
  }

  // Mobotix: "Full Image" a veces no vuelve con un único set.
  // Forzamos una secuencia adicional cuando se pide full image.
  if (key === "full image" || key === "fullimage" || key === "full" || key === "0") {
    urls.push(buildUrl(`/control/control?no_http_header&set&section=quickcontrol&display_mode=normal`, cfg));
    urls.push(buildUrl(`/control/control?no_http_header&set&section=quickcontrol&display_mode=fullimage`, cfg));
    urls.push(buildUrl(`/control/control?no_http_header&set&section=quickcontrol&display_mode=0`, cfg));
  }

  let lastStatus = 504;
  let lastText = "";
  let applied = false;
  for (const url of urls) {
    const fr = await fetchWithTimeout(url, 5000, cfg);
    if (!fr.ok) {
      lastStatus = 504;
      continue;
    }
    const r = fr.response;
    const text = await r.text();
    lastStatus = r.status;
    lastText = text;
    if (r.ok) {
      applied = true;
      break;
    }
  }
  if (!applied) {
    if (lastStatus === 504) return res.status(504).json({ ok: false, error: "CAMERA_TIMEOUT" });
    return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR", raw: lastText });
  }

  await audit(req, "CAMERA_DISPLAY_MODE", `Modo visualización: ${rawMode}`);
  return res.json({ ok: true, mode: rawMode });
});

cameraRouter.post("/relay/pulse", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = Number(req.auth?.id_lavanderia ?? 1);
  const cam = await resolveCamByLav(idLav);
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
  let fr = await fetchWithTimeout(url, 5000, cfg);
  if (!fr.ok) {
    // Algunas Mobotix ejecutan el relé pero cortan respuesta; reintentamos una vez.
    fr = await fetchWithTimeout(url, 5000, cfg);
  }
  if (!fr.ok) {
    await audit(req, "CAMERA_RELAY_PULSE_SOFT_OK", `Pulso relé ${kind} aplicado sin confirmación HTTP (outmask=${outmask},time=${time})`);
    return res.status(202).json({ ok: true, degraded: true, warning: "NO_HTTP_CONFIRMATION" });
  }
  const r = fr.response;
  const text = await r.text();
  if (!r.ok) return res.status(502).json({ ok: false, error: "CAMERA_UPSTREAM_ERROR" });

  await audit(req, "CAMERA_RELAY_PULSE", `Pulso relé ${kind} (outmask=${outmask},time=${time})`);
  return res.json({ ok: true, raw: text });
});

// Stream proxy (no expone credenciales). Image tag friendly.
cameraRouter.get("/stream.jpg", async (req, res) => {
  try {
    const resolved = await resolveStreamRequest(req);
    if (!resolved.ok) return sendStreamFallback(res, resolved.status);
    const cfg = resolved.cfg;

    const candidates = [
      `/record/current.jpg?rand=${Date.now()}`,
      `/control/faststream.jpg?stream=full&fps=16&rand=${Date.now()}`,
      `/cgi-bin/DownloadLiveImage?${Date.now()}`,
    ];
    let r: Response | null = null;
    for (const path of candidates) {
      const fr = await fetchWithTimeout(buildUrl(path, cfg), 8000, cfg);
      if (fr.ok && fr.response.ok) {
        r = fr.response;
        break;
      }
    }
    if (!r) return sendStreamFallback(res, 502);

    const contentType = r.headers.get("content-type") || "image/jpeg";
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch {
    return sendStreamFallback(res, 500);
  }
});

cameraRouter.get("/faststream.mjpg", async (req, res) => {
  try {
    const resolved = await resolveStreamRequest(req);
    if (!resolved.ok) return sendStreamFallback(res, resolved.status);
    const cfg = resolved.cfg;
    const url = buildUrl(`/control/faststream.jpg?stream=full&fps=16&rand=${Date.now()}`, cfg);
    const upstream = await fetch(url, {
      headers: { authorization: basicAuthHeader(cfg.user, cfg.pass) },
    });
    if (!upstream.ok || !upstream.body) return sendStreamFallback(res, 502);
    res.status(200);
    res.setHeader("content-type", upstream.headers.get("content-type") || "multipart/x-mixed-replace");
    res.setHeader("cache-control", "no-store");
    const nodeStream = Readable.fromWeb(upstream.body as any);
    req.on("close", () => nodeStream.destroy());
    nodeStream.pipe(res);
  } catch {
    return sendStreamFallback(res, 500);
  }
});

cameraRouter.get("/ui/:target", async (req, res) => {
  try {
    const resolved = await resolveStreamRequest(req);
    if (!resolved.ok) return res.status(resolved.status).send("Unauthorized");
    const cfg = resolved.cfg;
    const target = String(req.params?.target ?? "").toLowerCase();
    const candidates =
      target === "admin"
        ? ["/admin/index.html", "/admin/"]
        : target === "events"
          ? ["/control/player?eventlist", "/control/player"]
          : ["/control/userimage.html", "/control/userimage"];

    let html = "";
    let contentType = "text/html; charset=utf-8";
    let ok = false;

    for (const path of candidates) {
      const fr = await fetchWithTimeout(buildUrl(path, cfg), 8000, cfg);
      if (!fr.ok) continue;
      const r = fr.response;
      const text = await r.text();
      if (!r.ok) continue;
      html = text;
      contentType = r.headers.get("content-type") || contentType;
      ok = true;
      break;
    }

    if (!ok) return res.status(502).send("Camera upstream error");
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "no-store");
    return res.status(200).send(html);
  } catch {
    return res.status(500).send("Camera proxy error");
  }
});
