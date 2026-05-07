function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const corsOriginsRaw = parseCsv(process.env.CORS_ORIGIN);
const tokenSecret = required("AUTH_TOKEN_SECRET", process.env.AUTH_TOKEN_SECRET);
const weakDemoSecrets = new Set([
  "change-this-secret",
  "kwl-demo-cambiar-esta-clave-en-produccion-32chars",
  "kwl-backend-super-secret-2024",
]);

if (
  nodeEnv === "production" &&
  (tokenSecret.length < 32 ||
    tokenSecret.includes("cambiar-esta-clave") ||
    weakDemoSecrets.has(tokenSecret.toLowerCase()))
) {
  throw new Error("AUTH_TOKEN_SECRET must be a strong secret in production (>=32 chars, non-demo value)");
}

export const env = {
  nodeEnv,
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? "8080"),

  corsOrigins: corsOriginsRaw.filter((origin) => origin !== "*" && origin !== "null"),
  corsAllowAllOrigins: corsOriginsRaw.includes("*") && nodeEnv !== "production",
  corsAllowNullOrigin: corsOriginsRaw.includes("null") && nodeEnv !== "production",

  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? "3306"),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "kwl_lavanderia",
  },

  auth: {
    tokenSecret,
  },

  camera: {
    baseUrl: process.env.CAMERA_BASE_URL ?? "",
    user: process.env.CAMERA_USER ?? "",
    pass: process.env.CAMERA_PASS ?? "",
    baseUrl2: process.env.CAMERA2_BASE_URL ?? "",
    user2: process.env.CAMERA2_USER ?? "",
    pass2: process.env.CAMERA2_PASS ?? "",
  },

  mqtt: {
    url: process.env.MQTT_URL ?? "mqtt://mqtt:1883",
    user: process.env.MQTT_USER ?? "",
    pass: process.env.MQTT_PASS ?? "",
    enabled: (process.env.MQTT_ENABLED ?? "true").toLowerCase() === "true",
  },

  redis: {
    host: process.env.REDIS_HOST ?? "redis",
    port: Number(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD ?? "",
    db: Number(process.env.REDIS_DB ?? "0"),
    enabled: (process.env.REDIS_ENABLED ?? "true").toLowerCase() === "true",
    timeoutMs: Number(process.env.REDIS_TIMEOUT_MS ?? "1500"),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? "kwl",
  },
};
