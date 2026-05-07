import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { db } from "../../db/pool.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type LavanderiaRow = RowDataPacket & {
  id_lavanderia: number;
  nombre: string;
  codigo: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  activo: 0 | 1;
};

export const lavanderiasRouter = Router();

async function esSuperadmin(idUsuario: number): Promise<boolean> {
  const superLogin = String(process.env.SUPER_ADMIN_LOGIN ?? "").trim().toLowerCase();
  if (superLogin) {
    const [rows] = await db.query<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM usuario WHERE id_usuario = :idUsuario AND LOWER(login) = :login LIMIT 1",
      { idUsuario, login: superLogin },
    );
    return Number(rows[0]?.total ?? 0) > 0;
  }
  const [rows] = await db.query<(RowDataPacket & { id_usuario: number })[]>(
    "SELECT id_usuario FROM usuario WHERE rol = 'ADMIN' ORDER BY id_usuario ASC LIMIT 1",
  );
  return Number(rows[0]?.id_usuario ?? 0) === idUsuario;
}

lavanderiasRouter.get("/", requireAuth, async (req, res) => {
  const idUsuario = Number(req.auth?.id_usuario ?? "0");
  if (!idUsuario) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

  const [rows] = await db.query<LavanderiaRow[]>(
    `
    SELECT l.id_lavanderia, l.nombre, l.codigo, l.direccion, l.ciudad, l.provincia, l.activo
    FROM usuario_lavanderia ul
    JOIN lavanderia l ON l.id_lavanderia = ul.id_lavanderia
    WHERE ul.id_usuario = :idUsuario
    ORDER BY l.nombre
    `,
    { idUsuario },
  );

  res.json({ ok: true, lavanderias: rows });
});

lavanderiasRouter.post("/", requireAuth, async (req, res) => {
  const idUsuario = Number(req.auth?.id_usuario ?? "0");
  if (!idUsuario) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  if (!(await esSuperadmin(idUsuario))) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

  const nombre = String(req.body?.nombre ?? "").trim();
  const codigo = String(req.body?.codigo ?? "").trim().toUpperCase();
  const direccion = String(req.body?.direccion ?? "").trim() || null;
  const ciudad = String(req.body?.ciudad ?? "").trim() || null;
  const provincia = String(req.body?.provincia ?? "").trim() || null;
  const activo = Number(req.body?.activo ?? 1) ? 1 : 0;
  if (!nombre || !codigo) return res.status(400).json({ ok: false, error: "BAD_REQUEST" });
  if (!/^[A-Z0-9_-]{3,32}$/.test(codigo)) return res.status(400).json({ ok: false, error: "BAD_CODIGO" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM lavanderia WHERE codigo = :codigo FOR UPDATE",
      { codigo },
    );
    if (Number(exists[0]?.total ?? 0) > 0) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "CODIGO_EXISTS" });
    }

    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO lavanderia (nombre, codigo, direccion, ciudad, provincia, activo)
       VALUES (:nombre, :codigo, :direccion, :ciudad, :provincia, :activo)`,
      { nombre, codigo, direccion, ciudad, provincia, activo },
    );
    const idLav = Number(ins.insertId);
    await conn.query<ResultSetHeader>(
      "INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia) VALUES (:idUsuario, :idLav)",
      { idUsuario, idLav },
    );
    await conn.query<ResultSetHeader>(
      `INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
       VALUES
       ('LAVANDERIA', :idLav, 'iot_state', :iotState, 'Estado inicial IoT'),
       ('LAVANDERIA', :idLav, 'iot_schedule', :iotSchedule, 'Programación IoT individual'),
       ('LAVANDERIA', :idLav, 'iot_store_schedule', :storeSchedule, 'Programación general tienda'),
       ('LAVANDERIA', :idLav, 'iot_store_actions', :storeActions, 'Acciones abrir/cerrar tienda'),
       ('LAVANDERIA', :idLav, 'iot_store_open_machines', :openMachines, 'Máquinas al abrir'),
       ('LAVANDERIA', :idLav, 'iot_store_close_machines', :closeMachines, 'Máquinas al cerrar'),
       ('LAVANDERIA', :idLav, 'env_settings', :envSettings, 'Ajustes por lavandería')
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion)`,
      {
        idLav,
        iotState: JSON.stringify({ puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false }),
        iotSchedule: JSON.stringify({ puerta: { on: null, off: null }, luces: { on: null, off: null }, ventilacion: { on: null, off: null } }),
        storeSchedule: JSON.stringify({ open: null, close: null }),
        storeActions: JSON.stringify({ abrir_tienda: { puerta_abierta: true, luces_encendidas: true }, cerrar_tienda: { puerta_abierta: true, luces_encendidas: true } }),
        openMachines: JSON.stringify([]),
        closeMachines: JSON.stringify([]),
        envSettings: JSON.stringify({}),
      },
    );
    await conn.commit();
    return res.status(201).json({ ok: true, lavanderia: { id_lavanderia: idLav, nombre, codigo, direccion, ciudad, provincia, activo } });
  } catch {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});
