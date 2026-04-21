import dns from "node:dns";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import { env } from "./system/env.js";
import { apiRouter } from "./web/api.js";
import { notFoundHandler, errorHandler } from "./web/errors.js";
import { db } from "./db/pool.js";
import { startIoTScheduler } from "./iot/scheduler.js";
import { getMqttHealth, startMqttBridge } from "./iot/mqtt.js";

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
      // Permite:
      // - sin Origin (curl, server-side)
      // - Origin "null" (file://)
      if (!origin || origin === "null") return cb(null, true);
      if (!env.corsOrigins.length) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS_BLOCKED"));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  let dbOk = false;
  try {
    await db.query("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }
  res.json({
    ok: true,
    service: "kwl-backend",
    db: dbOk ? "ok" : "down",
    mqtt: getMqttHealth(),
    iot: { scheduler: "running" },
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, env.host, () => {
  // eslint-disable-next-line no-console
  console.log(`kwl-backend listening on http://${env.host}:${env.port}`);
  startIoTScheduler();
  startMqttBridge();
});
