import { Router } from "express";
import { db } from "../../db/pool.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { syncTarifaActivaLav } from "../../iot/mqtt.js";

export const configuracionRouter = Router();

type ConfigRow = RowDataPacket & {
  clave: string;
  valor: string;
  descripcion: string | null;
  fecha_actualizacion: Date;
};
type TarifaRow = RowDataPacket & {
  id_tarifa: number;
  precio_arranque: number;
  tiempo_base_minutos: number;
  importe_incremento: number;
  minutos_por_incremento: number;
};

type EnvSettings = {
  CAMERA_BASE_URL: string;
  CAMERA_USER: string;
  CAMERA_PASS: string;
  MQTT_URL: string;
  MQTT_USER: string;
  MQTT_PASS: string;
  CAMERA2_BASE_URL: string;
  CAMERA2_USER: string;
  CAMERA2_PASS: string;
  REDIS_ENABLED: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_PASSWORD: string;
  REDIS_DB: string;
  REDIS_TIMEOUT_MS: string;
  REDIS_KEY_PREFIX: string;
};

const EDITABLE_ENV_KEYS = [
  "CAMERA_BASE_URL",
  "CAMERA_USER",
  "CAMERA_PASS",
  "CAMERA2_BASE_URL",
  "CAMERA2_USER",
  "CAMERA2_PASS",
  "MQTT_URL",
  "MQTT_USER",
  "MQTT_PASS",
  "REDIS_ENABLED",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_DB",
  "REDIS_TIMEOUT_MS",
  "REDIS_KEY_PREFIX",
] as const;

function normalizeEnvValue(key: string, value: unknown) {
  const raw = String(value ?? "").trim();
  if (key === "REDIS_ENABLED") return raw.toLowerCase() === "false" ? "false" : "true";
  return raw;
}

async function persistEditableEnv(vars: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), ".env");
  let raw = "";
  try {
    raw = await fs.readFile(envPath, "utf8");
  } catch {
    raw = "";
  }

  const lines = raw.split(/\r?\n/);
  const idxByKey = new Map<string, number>();
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i]?.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m) idxByKey.set(m[1], i);
  }

  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${v}`;
    const idx = idxByKey.get(k);
    if (typeof idx === "number") lines[idx] = line;
    else lines.push(line);
    process.env[k] = v;
  }

  await fs.writeFile(envPath, `${lines.filter((x) => x !== undefined).join("\n").replace(/\n+$/, "")}\n`, "utf8");
}

type PublicWebSettings = {
  brand_name: string;
  nav_inicio: string;
  nav_about: string;
  nav_contacto: string;
  nav_faqs: string;
  inicio_bienvenida: string;
  inicio_titulo: string;
  inicio_subtitulo: string;
  about_titulo: string;
  about_subtitulo: string;
  about_parrafo_1: string;
  about_parrafo_2: string;
  about_card_1_titulo: string;
  about_card_1_texto: string;
  about_card_2_titulo: string;
  about_card_2_texto: string;
  about_card_3_titulo: string;
  about_card_3_texto: string;
  contacto_titulo: string;
  contacto_subtitulo: string;
  contacto_telefono: string;
  contacto_email: string;
  direccion_texto: string;
  contacto_ubicacion_titulo: string;
  contacto_ubicacion_texto: string;
  mapa_url: string;
  footer_titulo_horario: string;
  footer_titulo_mapa: string;
  footer_copy: string;
  horario_lunes: string;
  horario_martes: string;
  horario_miercoles: string;
  horario_jueves: string;
  horario_viernes: string;
  horario_sabado: string;
  horario_domingo: string;
  faq_q1: string;
  faq_a1: string;
  faq_q2: string;
  faq_a2: string;
  faq_q3: string;
  faq_a3: string;
  faq_q4: string;
  faq_a4: string;
  faq_q5: string;
  faq_a5: string;
  faq_q6: string;
  faq_a6: string;
  faqs_titulo: string;
  faqs_subtitulo: string;
  faqs_duda_titulo: string;
  faqs_duda_texto: string;
  faq_items: string;
};

const DEFAULT_PUBLIC_WEB_SETTINGS: PublicWebSettings = {
  brand_name: "KWL AQUA",
  nav_inicio: "Inicio",
  nav_about: "Sobre nosotros",
  nav_contacto: "Contacto",
  nav_faqs: "FAQs",
  inicio_bienvenida: "¡Bienvenido!",
  inicio_titulo: "Somos KWL Ponferrada",
  inicio_subtitulo: "Tu servicio de lavandería .",
  about_titulo: "¿Quiénes somos?",
  about_subtitulo: "Software y App para tu lavandería autoservicio",
  about_parrafo_1:
    "Ahorra tiempo y dinero. Fideliza a tus clientes. Con KWL podrás controlar tu lavandería autoservicio en remoto, desde cualquier lugar, evitando desplazamientos innecesarios y resolviendo los contratiempos de tus clientes de forma más rápida. ¡Cientos de lavanderías utilizan nuestro sistema!",
  about_parrafo_2:
    "Además, con nuestra App podrás ofrecer a tus clientes la opción de pagar con tarjeta o bizum, hacer promociones, descuentos ¡y mucho más!",
  about_card_1_titulo: "Horario amplio",
  about_card_1_texto: "Abierto todos los días para adaptarnos a tu rutina.",
  about_card_2_titulo: "Máquinas preparadas",
  about_card_2_texto: "Equipos pensados para ropa diaria, toallas, mantas y cargas grandes.",
  about_card_3_titulo: "Atención cercana",
  about_card_3_texto: "Si tienes una duda o incidencia, puedes contactar con nosotros.",
  contacto_titulo: "CONTACTANOS",
  contacto_subtitulo: "Estamos a tu disposición las 24h",
  contacto_telefono: "+34 636 684 021",
  contacto_email: "asistenciakwl@gmail.com",
  direccion_texto: "Calle Dr. Fleming, 26, Bajo, 24402 Ponferrada, León",
  contacto_ubicacion_titulo: "Ubicación",
  contacto_ubicacion_texto: "Nos encontrarás en Calle Dr. Fleming, 26, Ponferrada.",
  mapa_url: "https://www.google.com/maps?q=Calle%20Dr.%20Fleming%2C%2026%2C%2024402%20Ponferrada&output=embed",
  footer_titulo_horario: "Horario",
  footer_titulo_mapa: "Donde encontrarnos",
  footer_copy: "© 2025 KWL Aqua. Todos los derechos reservados.",
  horario_lunes: "8:30-22:00",
  horario_martes: "8:30-22:00",
  horario_miercoles: "8:30-22:00",
  horario_jueves: "8:30-22:00",
  horario_viernes: "8:30-22:00",
  horario_sabado: "8:30-22:00",
  horario_domingo: "8:30-22:00",
  faq_q1: "¿Qué es KWL Aqua?",
  faq_a1: "Es un sistema que digitaliza y automatiza el funcionamiento de lavanderías autoservicio.",
  faq_q2: "¿Cómo funciona KWL Aqua?",
  faq_a2: "Conecta tus máquinas al panel de control y permite gestionar ciclos, pagos y ocupación.",
  faq_q3: "¿Estropearán las lavadoras mi ropa?",
  faq_a3: "Las máquinas están calibradas y cuentan con mantenimiento periódico para garantizar un lavado óptimo.",
  faq_q4: "¿Puedo pagar con tarjeta?",
  faq_a4: "Sí, admitimos pagos con tarjeta, Bizum y monedero virtual de nuestra App.",
  faq_q5: "¿Existe algún tipo de permanencia?",
  faq_a5: "No exigimos permanencia. Puedes usar el servicio según tus necesidades sin compromisos.",
  faq_q6: "¿Existen descuentos en los precios o App móvil?",
  faq_a6: "Ofrecemos promociones puntuales y descuentos para usuarios registrados en nuestra aplicación.",
  faqs_titulo: "Resuelve tus dudas rápidas",
  faqs_subtitulo: "Estas son las preguntas más comunes antes de usar la lavandería.",
  faqs_duda_titulo: "¿No encuentras tu duda?",
  faqs_duda_texto: "Escríbenos o llámanos y te ayudaremos con tu consulta.",
  faq_items: "",
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

configuracionRouter.get("/", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT clave, valor, descripcion, fecha_actualizacion
    FROM configuracion
    WHERE ambito = 'LAVANDERIA' AND id_lavanderia = :idLav
    ORDER BY clave ASC
    `,
    { idLav },
  );
  const configuracion = rows.map((row) => {
    let valor: unknown = row.valor;
    try {
      valor = JSON.parse(row.valor);
    } catch {
      valor = row.valor;
    }
    return {
      clave: row.clave,
      valor,
      descripcion: row.descripcion,
      fecha_actualizacion: row.fecha_actualizacion,
    };
  });
  res.json({ ok: true, configuracion });
});

configuracionRouter.get("/env", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const envCfg = await getConfigLav<EnvSettings>(idLav, "env_settings", {
    CAMERA_BASE_URL: "",
    CAMERA_USER: "",
    CAMERA_PASS: "",
    MQTT_URL: "",
    MQTT_USER: "",
    MQTT_PASS: "",
    CAMERA2_BASE_URL: "",
    CAMERA2_USER: "",
    CAMERA2_PASS: "",
    REDIS_ENABLED: "true",
    REDIS_HOST: "",
    REDIS_PORT: "",
    REDIS_PASSWORD: "",
    REDIS_DB: "",
    REDIS_TIMEOUT_MS: "",
    REDIS_KEY_PREFIX: "",
  });
  res.json({
    ok: true,
    env: {
      CAMERA_BASE_URL: envCfg.CAMERA_BASE_URL,
      CAMERA_USER: envCfg.CAMERA_USER,
      CAMERA_PASS: "",
      CAMERA_PASS_SET: Boolean(envCfg.CAMERA_PASS),
      MQTT_URL: envCfg.MQTT_URL,
      MQTT_USER: envCfg.MQTT_USER,
      MQTT_PASS_SET: Boolean(envCfg.MQTT_PASS),
      CAMERA2_BASE_URL: envCfg.CAMERA2_BASE_URL,
      CAMERA2_USER: envCfg.CAMERA2_USER,
      CAMERA2_PASS_SET: Boolean(envCfg.CAMERA2_PASS),
      REDIS_ENABLED: envCfg.REDIS_ENABLED,
      REDIS_HOST: envCfg.REDIS_HOST,
      REDIS_PORT: envCfg.REDIS_PORT,
      REDIS_PASSWORD_SET: Boolean(envCfg.REDIS_PASSWORD),
      REDIS_DB: envCfg.REDIS_DB,
      REDIS_TIMEOUT_MS: envCfg.REDIS_TIMEOUT_MS,
      REDIS_KEY_PREFIX: envCfg.REDIS_KEY_PREFIX,
    },
  });
});

configuracionRouter.get("/web-public", async (req, res) => {
  const rawLav = Number(req.query?.lav);
  const idLav = Number.isFinite(rawLav) && rawLav > 0 ? rawLav : 1;
  const publicWeb = await getConfigLav<PublicWebSettings>(idLav, "web_public_content", DEFAULT_PUBLIC_WEB_SETTINGS);
  res.json({ ok: true, contenido: { ...DEFAULT_PUBLIC_WEB_SETTINGS, ...publicWeb } });
});

configuracionRouter.get("/web-public/admin", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const publicWeb = await getConfigLav<PublicWebSettings>(idLav, "web_public_content", DEFAULT_PUBLIC_WEB_SETTINGS);
  res.json({ ok: true, contenido: { ...DEFAULT_PUBLIC_WEB_SETTINGS, ...publicWeb } });
});

configuracionRouter.put("/web-public/admin", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const body = req.body ?? {};
  const next: PublicWebSettings = {
    brand_name: String(body.brand_name ?? DEFAULT_PUBLIC_WEB_SETTINGS.brand_name).trim(),
    nav_inicio: String(body.nav_inicio ?? DEFAULT_PUBLIC_WEB_SETTINGS.nav_inicio).trim(),
    nav_about: String(body.nav_about ?? DEFAULT_PUBLIC_WEB_SETTINGS.nav_about).trim(),
    nav_contacto: String(body.nav_contacto ?? DEFAULT_PUBLIC_WEB_SETTINGS.nav_contacto).trim(),
    nav_faqs: String(body.nav_faqs ?? DEFAULT_PUBLIC_WEB_SETTINGS.nav_faqs).trim(),
    inicio_bienvenida: String(body.inicio_bienvenida ?? DEFAULT_PUBLIC_WEB_SETTINGS.inicio_bienvenida).trim(),
    inicio_titulo: String(body.inicio_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.inicio_titulo).trim(),
    inicio_subtitulo: String(body.inicio_subtitulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.inicio_subtitulo).trim(),
    about_titulo: String(body.about_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_titulo).trim(),
    about_subtitulo: String(body.about_subtitulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_subtitulo).trim(),
    about_parrafo_1: String(body.about_parrafo_1 ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_parrafo_1).trim(),
    about_parrafo_2: String(body.about_parrafo_2 ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_parrafo_2).trim(),
    about_card_1_titulo: String(body.about_card_1_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_1_titulo).trim(),
    about_card_1_texto: String(body.about_card_1_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_1_texto).trim(),
    about_card_2_titulo: String(body.about_card_2_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_2_titulo).trim(),
    about_card_2_texto: String(body.about_card_2_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_2_texto).trim(),
    about_card_3_titulo: String(body.about_card_3_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_3_titulo).trim(),
    about_card_3_texto: String(body.about_card_3_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.about_card_3_texto).trim(),
    contacto_titulo: String(body.contacto_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_titulo).trim(),
    contacto_subtitulo: String(body.contacto_subtitulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_subtitulo).trim(),
    contacto_telefono: String(body.contacto_telefono ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_telefono).trim(),
    contacto_email: String(body.contacto_email ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_email).trim(),
    direccion_texto: String(body.direccion_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.direccion_texto).trim(),
    contacto_ubicacion_titulo: String(body.contacto_ubicacion_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_ubicacion_titulo).trim(),
    contacto_ubicacion_texto: String(body.contacto_ubicacion_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.contacto_ubicacion_texto).trim(),
    mapa_url: String(body.mapa_url ?? DEFAULT_PUBLIC_WEB_SETTINGS.mapa_url).trim(),
    footer_titulo_horario: String(body.footer_titulo_horario ?? DEFAULT_PUBLIC_WEB_SETTINGS.footer_titulo_horario).trim(),
    footer_titulo_mapa: String(body.footer_titulo_mapa ?? DEFAULT_PUBLIC_WEB_SETTINGS.footer_titulo_mapa).trim(),
    footer_copy: String(body.footer_copy ?? DEFAULT_PUBLIC_WEB_SETTINGS.footer_copy).trim(),
    horario_lunes: String(body.horario_lunes ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_lunes).trim(),
    horario_martes: String(body.horario_martes ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_martes).trim(),
    horario_miercoles: String(body.horario_miercoles ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_miercoles).trim(),
    horario_jueves: String(body.horario_jueves ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_jueves).trim(),
    horario_viernes: String(body.horario_viernes ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_viernes).trim(),
    horario_sabado: String(body.horario_sabado ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_sabado).trim(),
    horario_domingo: String(body.horario_domingo ?? DEFAULT_PUBLIC_WEB_SETTINGS.horario_domingo).trim(),
    faq_q1: String(body.faq_q1 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q1).trim(),
    faq_a1: String(body.faq_a1 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a1).trim(),
    faq_q2: String(body.faq_q2 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q2).trim(),
    faq_a2: String(body.faq_a2 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a2).trim(),
    faq_q3: String(body.faq_q3 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q3).trim(),
    faq_a3: String(body.faq_a3 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a3).trim(),
    faq_q4: String(body.faq_q4 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q4).trim(),
    faq_a4: String(body.faq_a4 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a4).trim(),
    faq_q5: String(body.faq_q5 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q5).trim(),
    faq_a5: String(body.faq_a5 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a5).trim(),
    faq_q6: String(body.faq_q6 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_q6).trim(),
    faq_a6: String(body.faq_a6 ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_a6).trim(),
    faqs_titulo: String(body.faqs_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.faqs_titulo).trim(),
    faqs_subtitulo: String(body.faqs_subtitulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.faqs_subtitulo).trim(),
    faqs_duda_titulo: String(body.faqs_duda_titulo ?? DEFAULT_PUBLIC_WEB_SETTINGS.faqs_duda_titulo).trim(),
    faqs_duda_texto: String(body.faqs_duda_texto ?? DEFAULT_PUBLIC_WEB_SETTINGS.faqs_duda_texto).trim(),
    faq_items: String(body.faq_items ?? DEFAULT_PUBLIC_WEB_SETTINGS.faq_items).trim(),
  };
  await setConfigLav(idLav, "web_public_content", next, "Contenido editable web publica");
  res.json({ ok: true, contenido: next });
});

configuracionRouter.put("/env", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const current = await getConfigLav<EnvSettings>(idLav, "env_settings", {
    CAMERA_BASE_URL: "",
    CAMERA_USER: "",
    CAMERA_PASS: "",
    MQTT_URL: "",
    MQTT_USER: "",
    MQTT_PASS: "",
    CAMERA2_BASE_URL: "",
    CAMERA2_USER: "",
    CAMERA2_PASS: "",
    REDIS_ENABLED: "true",
    REDIS_HOST: "",
    REDIS_PORT: "",
    REDIS_PASSWORD: "",
    REDIS_DB: "",
    REDIS_TIMEOUT_MS: "",
    REDIS_KEY_PREFIX: "",
  });
  const payload = (req.body ?? {}) as Record<string, unknown>;
  const next = { ...current } as Record<string, string>;
  for (const key of EDITABLE_ENV_KEYS) {
    const val = payload[key];
    if (val === undefined) continue;
    if (String(key).endsWith("_PASS") || key === "REDIS_PASSWORD") {
      const pass = String(val ?? "");
      if (pass) next[key] = normalizeEnvValue(key, pass);
      continue;
    }
    next[key] = normalizeEnvValue(key, val);
  }
  const envCfg = next as EnvSettings;
  await setConfigLav(idLav, "env_settings", envCfg, "Ajustes ENV por tienda (demo/admin)");
  await persistEditableEnv(Object.fromEntries(EDITABLE_ENV_KEYS.map((k) => [k, envCfg[k]])));
  res.json({ ok: true, env: envCfg, note: "Cambios guardados en BD y .env del backend. Reinicia servicios para aplicar completamente." });
});

configuracionRouter.get("/tarifa-actual", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const [rows] = await db.query<TarifaRow[]>(
    `SELECT id_tarifa, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento
     FROM tarifa_maquina
     WHERE id_lavanderia = :idLav AND activa = 1
       AND (fecha_inicio_vigencia <= NOW())
       AND (fecha_fin_vigencia IS NULL OR fecha_fin_vigencia > NOW())
     ORDER BY fecha_inicio_vigencia DESC, id_tarifa DESC
     LIMIT 1`,
    { idLav },
  );
  const t = rows[0] ?? null;
  if (!t) return res.json({ ok: true, tarifa: null });
  return res.json({
    ok: true,
    tarifa: {
      id_tarifa: Number(t.id_tarifa),
      precio_ciclo: Number(t.precio_arranque),
      tiempo_ciclo_min: Number(t.tiempo_base_minutos),
      precio_ampliacion: Number(t.importe_incremento),
      minutos_ampliacion: Number(t.minutos_por_incremento),
    },
  });
});

configuracionRouter.put("/tarifa-actual", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const precioCiclo = Number(req.body?.precio_ciclo);
  const tiempoCicloMin = Number(req.body?.tiempo_ciclo_min);
  const precioAmpliacion = Number(req.body?.precio_ampliacion);
  const minutosAmpliacion = Number(req.body?.minutos_ampliacion);
  if (!Number.isFinite(precioCiclo) || precioCiclo < 0) return res.status(400).json({ ok: false, error: "BAD_PRECIO_CICLO" });
  if (!Number.isFinite(tiempoCicloMin) || tiempoCicloMin <= 0) return res.status(400).json({ ok: false, error: "BAD_TIEMPO_CICLO" });
  if (!Number.isFinite(precioAmpliacion) || precioAmpliacion <= 0) return res.status(400).json({ ok: false, error: "BAD_PRECIO_AMPLIACION" });
  if (!Number.isFinite(minutosAmpliacion) || minutosAmpliacion <= 0) return res.status(400).json({ ok: false, error: "BAD_MINUTOS_AMPLIACION" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query<ResultSetHeader>(
      "UPDATE tarifa_maquina SET activa = 0, fecha_fin_vigencia = NOW() WHERE id_lavanderia = :idLav AND activa = 1 AND fecha_fin_vigencia IS NULL",
      { idLav },
    );
    await conn.query<ResultSetHeader>(
      `INSERT INTO tarifa_maquina (
        id_lavanderia, nombre, precio_arranque, tiempo_base_minutos,
        importe_incremento, minutos_por_incremento, fecha_inicio_vigencia, fecha_fin_vigencia, activa
      ) VALUES (
        :idLav, :nombre, :precio, :tiempo, :incPrecio, :incMin, NOW(), NULL, 1
      )`,
      {
        idLav,
        nombre: `Tarifa ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
        precio: precioCiclo,
        tiempo: Math.trunc(tiempoCicloMin),
        incPrecio: precioAmpliacion,
        incMin: Math.trunc(minutosAmpliacion),
      },
    );
    await conn.commit();
    await syncTarifaActivaLav(idLav);
    return res.json({ ok: true });
  } catch {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

configuracionRouter.get("/:clave", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const clave = String(req.params.clave ?? "").trim();
  if (!clave) return res.status(400).json({ ok: false, error: "BAD_CLAVE" });
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT clave, valor, descripcion, fecha_actualizacion
    FROM configuracion
    WHERE ambito = 'LAVANDERIA' AND id_lavanderia = :idLav AND clave = :clave
    LIMIT 1
    `,
    { idLav, clave },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ ok: false, error: "CONFIG_NOT_FOUND" });
  let valor: unknown = row.valor;
  try {
    valor = JSON.parse(row.valor);
  } catch {
    valor = row.valor;
  }
  return res.json({ ok: true, configuracion: { clave: row.clave, valor, descripcion: row.descripcion, fecha_actualizacion: row.fecha_actualizacion } });
});

configuracionRouter.put("/:clave", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const clave = String(req.params.clave ?? "").trim();
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(clave)) return res.status(400).json({ ok: false, error: "BAD_CLAVE" });
  const valor = req.body?.valor;
  if (valor === undefined) return res.status(400).json({ ok: false, error: "BAD_VALOR" });
  const descripcion = String(req.body?.descripcion ?? `Configuración ${clave}`).slice(0, 255);
  await setConfigLav(idLav, clave, valor, descripcion);
  res.json({ ok: true, clave, valor });
});
