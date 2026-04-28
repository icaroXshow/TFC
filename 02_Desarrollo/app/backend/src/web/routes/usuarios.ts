import { Router } from "express";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { db } from "../../db/pool.js";
import type { UsuarioRow } from "../../db/types.js";
import type { ResultSetHeader } from "mysql2/promise";
import bcrypt from "bcryptjs";

export const usuariosRouter = Router();

function isValidEmail(email: string) {
  // Suficiente para MVP (sin regex monstruosa)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidRole(rol: string) {
  return rol === "ADMIN" || rol === "OPERADOR";
}

function randomPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function audit(req: any, accion: string, idEntidad: number, detalle: string) {
  const idUsuario = Number(req.auth?.id_usuario ?? "0") || 1;
  const idLav = Number(req.auth?.id_lavanderia ?? 1) || 1;
  await db.query<ResultSetHeader>(
    `
    INSERT INTO auditoria (
      id_usuario, id_lavanderia, id_maquina, id_ciclo,
      fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
    ) VALUES (
      :idUsuario, :idLav, NULL, NULL,
      NOW(), :accion, 'usuario', :idEntidad, :detalle, :ip
    )
    `,
    { idUsuario, idLav, accion, idEntidad, detalle, ip: req.ip ?? null },
  );
}

async function userBelongsToLav(idUsuario: number, idLavanderia: number) {
  const [rows] = await db.query<(import("mysql2/promise").RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM usuario_lavanderia WHERE id_usuario = :idUsuario AND id_lavanderia = :idLavanderia",
    { idUsuario, idLavanderia },
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function adminCanManageUserEverywhere(adminId: number, idUsuario: number) {
  const [rows] = await db.query<(import("mysql2/promise").RowDataPacket & { total: number })[]>(
    `
    SELECT COUNT(*) AS total
    FROM usuario_lavanderia ul
    LEFT JOIN usuario_lavanderia admin_lav
      ON admin_lav.id_lavanderia = ul.id_lavanderia
     AND admin_lav.id_usuario = :adminId
    WHERE ul.id_usuario = :idUsuario
      AND admin_lav.id_usuario IS NULL
    `,
    { adminId, idUsuario },
  );
  return Number(rows[0]?.total ?? 0) === 0;
}

usuariosRouter.get("/", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  const [rows] = await db.query<UsuarioRow[]>(
    `
    SELECT u.id_usuario, u.nombre, u.apellidos, u.login, u.password_hash, u.rol, u.activo, u.ultimo_acceso
    FROM usuario u
    INNER JOIN usuario_lavanderia ul ON ul.id_usuario = u.id_usuario
    WHERE ul.id_lavanderia = :idLav
    ORDER BY u.activo DESC, u.rol ASC, u.login ASC
    `,
    { idLav: idLavanderia },
  );

  const usuarios = rows.map((u) => ({
    id_usuario: u.id_usuario,
    nombre: u.nombre,
    apellidos: u.apellidos,
    email: u.login,
    rol: u.rol,
    activo: u.activo,
    ultimo_acceso: u.ultimo_acceso,
  }));

  res.json({ ok: true, usuarios });
});

usuariosRouter.post("/", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;

  const nombre = String(req.body?.nombre ?? "").trim();
  const apellidos = String(req.body?.apellidos ?? "").trim() || null;
  const email = String(req.body?.email ?? req.body?.login ?? "").trim().toLowerCase();
  const rol = String(req.body?.rol ?? "OPERADOR").trim().toUpperCase();
  const rawPassword = String(req.body?.password ?? "").trim();

  if (!nombre || !email) return res.status(400).json({ ok: false, error: "BAD_REQUEST" });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "BAD_EMAIL" });
  if (!isValidRole(rol)) return res.status(400).json({ ok: false, error: "BAD_ROLE" });

  const password = rawPassword || randomPassword(10);
  const password_hash = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query<UsuarioRow[]>(
      "SELECT id_usuario, nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso FROM usuario WHERE login = :login LIMIT 1 FOR UPDATE",
      { login: email },
    );
    if (existing[0]) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "EMAIL_EXISTS" });
    }

    const [ins] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO usuario (nombre, apellidos, login, password_hash, rol, activo)
      VALUES (:nombre, :apellidos, :login, :password_hash, :rol, 1)
      `,
      { nombre, apellidos, login: email, password_hash, rol },
    );
    const idUsuarioNuevo = Number(ins.insertId);

    await conn.query<ResultSetHeader>(
      `
      INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia)
      VALUES (:idUsuario, :idLav)
      `,
      { idUsuario: idUsuarioNuevo, idLav: idLavanderia },
    );

    await conn.commit();
    await audit(req, "USUARIO_CREATE", idUsuarioNuevo, `Crear usuario ${email} (${rol})`);

    res.status(201).json({
      ok: true,
      usuario: { id_usuario: idUsuarioNuevo, nombre, apellidos, email, rol, activo: 1 },
      tempPassword: rawPassword ? null : password,
    });
  } catch (e) {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

usuariosRouter.put("/:id", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  const adminId = Number(req.auth?.id_usuario ?? "0");
  const idUsuario = Number(req.params.id);
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({ ok: false, error: "BAD_USER_ID" });
  }

  const nombre = req.body?.nombre !== undefined ? String(req.body?.nombre ?? "").trim() : undefined;
  const apellidos = req.body?.apellidos !== undefined ? (String(req.body?.apellidos ?? "").trim() || null) : undefined;
  const email = req.body?.email !== undefined ? String(req.body?.email ?? "").trim().toLowerCase() : undefined;
  const rol = req.body?.rol !== undefined ? String(req.body?.rol ?? "").trim().toUpperCase() : undefined;
  const rawPassword = req.body?.password !== undefined ? String(req.body?.password ?? "").trim() : undefined;

  if (email !== undefined && !isValidEmail(email)) return res.status(400).json({ ok: false, error: "BAD_EMAIL" });
  if (rol !== undefined && !isValidRole(rol)) return res.status(400).json({ ok: false, error: "BAD_ROLE" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (!(await adminCanManageUserEverywhere(adminId, idUsuario))) {
      await conn.rollback();
      return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });
    }

    const [rows] = await conn.query<UsuarioRow[]>(
      `
      SELECT u.id_usuario, u.nombre, u.apellidos, u.login, u.password_hash, u.rol, u.activo, u.ultimo_acceso
      FROM usuario u
      INNER JOIN usuario_lavanderia ul ON ul.id_usuario = u.id_usuario
      WHERE u.id_usuario = :idUsuario AND ul.id_lavanderia = :idLav
      LIMIT 1
      FOR UPDATE
      `,
      { idUsuario, idLav: idLavanderia },
    );
    const user = rows[0];
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });
    }

    if (email !== undefined && email !== user.login) {
      const [dup] = await conn.query<UsuarioRow[]>(
        "SELECT id_usuario, nombre, apellidos, login, password_hash, rol, activo, ultimo_acceso FROM usuario WHERE login = :login LIMIT 1 FOR UPDATE",
        { login: email },
      );
      if (dup[0]) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "EMAIL_EXISTS" });
      }
    }

    const nextNombre = nombre ?? user.nombre;
    const nextApellidos = apellidos !== undefined ? apellidos : user.apellidos;
    const nextEmail = email ?? user.login;
    const nextRol = rol ?? user.rol;
    const nextHash =
      rawPassword !== undefined && rawPassword
        ? await bcrypt.hash(rawPassword, 10)
        : user.password_hash;

    await conn.query<ResultSetHeader>(
      `
      UPDATE usuario
      SET nombre = :nombre,
          apellidos = :apellidos,
          login = :login,
          password_hash = :password_hash,
          rol = :rol
      WHERE id_usuario = :idUsuario
      `,
      {
        idUsuario,
        nombre: nextNombre,
        apellidos: nextApellidos,
        login: nextEmail,
        password_hash: nextHash,
        rol: nextRol,
      },
    );

    await conn.commit();
    await audit(req, "USUARIO_UPDATE", idUsuario, `Actualizar usuario ${nextEmail} (${nextRol})`);

    return res.json({
      ok: true,
      usuario: {
        id_usuario: idUsuario,
        nombre: nextNombre,
        apellidos: nextApellidos,
        email: nextEmail,
        rol: nextRol,
        activo: user.activo,
        ultimo_acceso: user.ultimo_acceso,
      },
    });
  } catch {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

usuariosRouter.post("/:id/activar", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  const adminId = Number(req.auth?.id_usuario ?? "0");
  const idUsuario = Number(req.params.id);
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(400).json({ ok: false, error: "BAD_USER_ID" });
  if (!(await adminCanManageUserEverywhere(adminId, idUsuario))) return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });

  const [rows] = await db.query<UsuarioRow[]>(
    `
    SELECT u.id_usuario, u.nombre, u.apellidos, u.login, u.password_hash, u.rol, u.activo, u.ultimo_acceso
    FROM usuario u
    INNER JOIN usuario_lavanderia ul ON ul.id_usuario = u.id_usuario
    WHERE u.id_usuario = :idUsuario AND ul.id_lavanderia = :idLav
    LIMIT 1
    `,
    { idUsuario, idLav: idLavanderia },
  );
  if (!rows[0]) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  await db.query<ResultSetHeader>("UPDATE usuario SET activo = 1 WHERE id_usuario = :idUsuario", { idUsuario });
  await audit(req, "USUARIO_ACTIVAR", idUsuario, `Activar usuario ${rows[0].login}`);
  return res.json({ ok: true });
});

usuariosRouter.post("/:id/desactivar", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  const adminId = Number(req.auth?.id_usuario ?? "0");
  const idUsuario = Number(req.params.id);
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(400).json({ ok: false, error: "BAD_USER_ID" });
  if (!(await adminCanManageUserEverywhere(adminId, idUsuario))) return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });

  const currentUserId = Number(req.auth?.id_usuario ?? "0");
  if (currentUserId && idUsuario === currentUserId) {
    return res.status(409).json({ ok: false, error: "CANNOT_DISABLE_SELF" });
  }

  const [rows] = await db.query<UsuarioRow[]>(
    `
    SELECT u.id_usuario, u.nombre, u.apellidos, u.login, u.password_hash, u.rol, u.activo, u.ultimo_acceso
    FROM usuario u
    INNER JOIN usuario_lavanderia ul ON ul.id_usuario = u.id_usuario
    WHERE u.id_usuario = :idUsuario AND ul.id_lavanderia = :idLav
    LIMIT 1
    `,
    { idUsuario, idLav: idLavanderia },
  );
  if (!rows[0]) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  await db.query<ResultSetHeader>("UPDATE usuario SET activo = 0 WHERE id_usuario = :idUsuario", { idUsuario });
  await audit(req, "USUARIO_DESACTIVAR", idUsuario, `Desactivar usuario ${rows[0].login}`);
  return res.json({ ok: true });
});

usuariosRouter.get("/:id/lavanderias", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idUsuario = Number(req.params.id);
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(400).json({ ok: false, error: "BAD_USER_ID" });
  if (!(await userBelongsToLav(idUsuario, idLavanderia))) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  const [rows] = await db.query<(import("mysql2/promise").RowDataPacket & { id_lavanderia: number })[]>(
    `
    SELECT ul.id_lavanderia
    FROM usuario_lavanderia ul
    INNER JOIN usuario_lavanderia admin_lav ON admin_lav.id_lavanderia = ul.id_lavanderia
    WHERE ul.id_usuario = :idUsuario AND admin_lav.id_usuario = :adminId
    ORDER BY ul.id_lavanderia ASC
    `,
    { idUsuario, adminId: Number(req.auth?.id_usuario ?? "0") },
  );
  return res.json({ ok: true, lavanderias: rows.map((r) => Number(r.id_lavanderia)) });
});

usuariosRouter.put("/:id/lavanderias", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idUsuario = Number(req.params.id);
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(400).json({ ok: false, error: "BAD_USER_ID" });

  const idLavanderiaActual = req.auth?.id_lavanderia ?? 1;
  const adminId = Number(req.auth?.id_usuario ?? "0");
  const ids: number[] = [...new Set<number>(Array.isArray(req.body?.lavanderias) ? req.body.lavanderias.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0) : [])];
  if (!ids.length) return res.status(400).json({ ok: false, error: "BAD_LAVANDERIAS" });
  if (!(await userBelongsToLav(idUsuario, idLavanderiaActual))) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  const [unauthorizedCurrent] = await db.query<(import("mysql2/promise").RowDataPacket & { total: number })[]>(
    `
    SELECT COUNT(*) AS total
    FROM usuario_lavanderia ul
    LEFT JOIN usuario_lavanderia admin_lav
      ON admin_lav.id_lavanderia = ul.id_lavanderia
     AND admin_lav.id_usuario = :adminId
    WHERE ul.id_usuario = :idUsuario
      AND admin_lav.id_usuario IS NULL
    `,
    { idUsuario, adminId },
  );
  if (Number(unauthorizedCurrent[0]?.total ?? 0) > 0) {
    return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });
  }

  const idsCsv = ids.join(",");
  const [allowedRows] = await db.query<(import("mysql2/promise").RowDataPacket & { total: number })[]>(
    "SELECT COUNT(DISTINCT id_lavanderia) AS total FROM usuario_lavanderia WHERE id_usuario = :adminId AND FIND_IN_SET(id_lavanderia, :idsCsv) > 0",
    { adminId, idsCsv },
  );
  if (Number(allowedRows[0]?.total ?? 0) !== ids.length) {
    return res.status(403).json({ ok: false, error: "FORBIDDEN_LAVANDERIA" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query<ResultSetHeader>("DELETE FROM usuario_lavanderia WHERE id_usuario = :idUsuario", { idUsuario });
    for (const idLav of ids) {
      await conn.query<ResultSetHeader>(
        "INSERT INTO usuario_lavanderia (id_usuario, id_lavanderia) VALUES (:idUsuario, :idLav)",
        { idUsuario, idLav },
      );
    }
    await conn.commit();
    await audit(req, "USUARIO_SET_LAVANDERIAS", idUsuario, `Tiendas: ${ids.join(",")}`);
    return res.json({ ok: true });
  } catch {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

usuariosRouter.delete("/:id", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idUsuario = Number(req.params.id);
  const idLavanderia = req.auth?.id_lavanderia ?? 1;
  if (!Number.isFinite(idUsuario) || idUsuario <= 0) return res.status(400).json({ ok: false, error: "BAD_USER_ID" });
  const currentUserId = Number(req.auth?.id_usuario ?? "0");
  if (currentUserId && idUsuario === currentUserId) return res.status(409).json({ ok: false, error: "CANNOT_DELETE_SELF" });

  const [rows] = await db.query<UsuarioRow[]>(
    `
    SELECT u.id_usuario, u.nombre, u.apellidos, u.login, u.password_hash, u.rol, u.activo, u.ultimo_acceso
    FROM usuario u
    INNER JOIN usuario_lavanderia ul ON ul.id_usuario = u.id_usuario
    WHERE u.id_usuario = :idUsuario AND ul.id_lavanderia = :idLav
    LIMIT 1
    `,
    { idUsuario, idLav: idLavanderia },
  );
  if (!rows[0]) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query<ResultSetHeader>(
      "DELETE FROM usuario_lavanderia WHERE id_usuario = :idUsuario AND id_lavanderia = :idLav",
      { idUsuario, idLav: idLavanderia },
    );
    const [remaining] = await conn.query<(import("mysql2/promise").RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM usuario_lavanderia WHERE id_usuario = :idUsuario",
      { idUsuario },
    );
    const disabled = Number(remaining[0]?.total ?? 0) === 0;
    if (disabled) {
      await conn.query<ResultSetHeader>("UPDATE usuario SET activo = 0 WHERE id_usuario = :idUsuario", { idUsuario });
    }
    await conn.commit();
    await audit(req, "USUARIO_DELETE", idUsuario, `Quitar usuario ${rows[0].login} de lavandería ${idLavanderia}`);
    return res.json({ ok: true, removed_from_lavanderia: true, disabled });
  } catch {
    await conn.rollback();
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});
