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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? "8080"),

  corsOrigins: parseCsv(process.env.CORS_ORIGIN),

  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? "3306"),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "kwl_lavanderia",
  },

  auth: {
    tokenSecret: required("AUTH_TOKEN_SECRET", process.env.AUTH_TOKEN_SECRET),
  },

  camera: {
    baseUrl: process.env.CAMERA_BASE_URL ?? "",
    user: process.env.CAMERA_USER ?? "",
    pass: process.env.CAMERA_PASS ?? "",
    streamUser: process.env.CAMERA_STREAM_USER ?? process.env.CAMERA_USER ?? "",
    streamPass: process.env.CAMERA_STREAM_PASS ?? process.env.CAMERA_PASS ?? "",
    baseUrl2: process.env.CAMERA2_BASE_URL ?? "",
    user2: process.env.CAMERA2_USER ?? "",
    pass2: process.env.CAMERA2_PASS ?? "",
    streamUser2: process.env.CAMERA2_STREAM_USER ?? process.env.CAMERA2_USER ?? "",
    streamPass2: process.env.CAMERA2_STREAM_PASS ?? process.env.CAMERA2_PASS ?? "",
  },

  mqtt: {
    url: process.env.MQTT_URL ?? "mqtt://mqtt:1883",
    user: process.env.MQTT_USER ?? "",
    pass: process.env.MQTT_PASS ?? "",
    enabled: (process.env.MQTT_ENABLED ?? "true").toLowerCase() === "true",
  },
};
