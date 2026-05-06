import dns from "node:dns";
import http from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { WebSocketServer } from "ws";

import { env } from "./system/env.js";
import { apiRouter } from "./web/api.js";
import { notFoundHandler, errorHandler } from "./web/errors.js";
import { db } from "./db/pool.js";
import { startIoTScheduler } from "./iot/scheduler.js";
import { getMqttHealth, startMqttBridge } from "./iot/mqtt.js";
import { getRedisHealthSnapshot, redisPingOk } from "./cache/redis.js";

// En algunos entornos (WSL/Windows), resolver IPv6 primero puede colgar conexiones HTTP.
// Forzamos IPv4-first para evitar timeouts "fantasma" en el proxy de cámara.
dns.setDefaultResultOrder("ipv4first");

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    // El panel admin (8081) embebe recursos del backend (8080) como imágenes.
    // Sin esto, CORP same-origin puede bloquear el stream proxy de cámara.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin(origin, cb) {
      // En producción, bloqueamos peticiones sin Origin para evitar superficie CORS implícita.
      // En desarrollo/demo se permite (curl, health checks, scripts locales).
      if (!origin) return cb(null, env.nodeEnv !== "production");
      // Origin null solo en desarrollo/demo local cuando se declara explícitamente.
      if (origin === "null") return cb(null, env.corsAllowNullOrigin);
      // El comodín se acepta solo fuera de producción para evitar CORS demasiado permisivo.
      if (env.corsAllowAllOrigins) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS_BLOCKED"));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  const now = new Date();
  const timestampMadrid = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now).replace(" ", "T");
  let dbOk = false;
  let redisOk = false;
  try {
    await db.query("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }
  redisOk = await redisPingOk();
  res.json({
    ok: true,
    service: "kwl-backend",
    db: dbOk ? "ok" : "down",
    redis: getRedisHealthSnapshot(redisOk),
    mqtt: getMqttHealth(),
    iot: { scheduler: "running" },
    timestamp: now.toISOString(),
    timestamp_madrid: timestampMadrid,
  });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/admin-live" });

type LiveClient = { ws: any; lavId: number };
const liveClients = new Set<LiveClient>();

async function buildLiveSnapshot(lavId: number) {
  const [mRows] = await db.query<any[]>(
    `
    SELECT
      m.id_maquina, m.codigo_visible, m.tipo_maquina, m.estado_actual,
      GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(c.fecha_hora_inicio, INTERVAL c.duracion_total_programada_min MINUTE))) AS segundos_restantes_estimados
    FROM maquina m
    LEFT JOIN ciclo c ON c.id_maquina = m.id_maquina AND c.estado_ciclo='INICIADO'
    WHERE m.id_lavanderia = :idLav
    ORDER BY m.codigo_visible
    `,
    { idLav: lavId },
  );
  const [iotRows] = await db.query<any[]>(
    "SELECT valor FROM configuracion WHERE ambito='LAVANDERIA' AND id_lavanderia=:idLav AND clave='iot_state' LIMIT 1",
    { idLav: lavId },
  );
  let iot = { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false };
  try {
    if (iotRows?.[0]?.valor) iot = JSON.parse(String(iotRows[0].valor));
  } catch {}
  return { ts: new Date().toISOString(), lav_id: lavId, maquinas: mRows, iot };
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const lavId = Math.max(1, Number(url.searchParams.get("lav") || "1"));
  const client = { ws, lavId };
  liveClients.add(client);
  ws.on("close", () => liveClients.delete(client));
  ws.on("error", () => liveClients.delete(client));
  buildLiveSnapshot(lavId)
    .then((snap) => ws.send(JSON.stringify(snap)))
    .catch(() => {});
});

setInterval(async () => {
  if (!liveClients.size) return;
  const byLav = new Map<number, any>();
  for (const c of [...liveClients]) {
    if (c.ws.readyState !== 1) {
      liveClients.delete(c);
      continue;
    }
    if (!byLav.has(c.lavId)) {
      try {
        byLav.set(c.lavId, await buildLiveSnapshot(c.lavId));
      } catch {
        continue;
      }
    }
    try {
      c.ws.send(JSON.stringify(byLav.get(c.lavId)));
    } catch {
      liveClients.delete(c);
    }
  }
}, 1000).unref();

server.listen(env.port, env.host, () => {
  // eslint-disable-next-line no-console
  console.log(`kwl-backend listening on http://${env.host}:${env.port}`);
  startIoTScheduler();
  startMqttBridge();
});
