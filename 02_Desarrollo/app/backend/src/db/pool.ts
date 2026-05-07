import mysql from "mysql2/promise";
import { env } from "../system/env.js";

const configuracionPool = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  connectionLimit: 10,
  enableKeepAlive: true,
  namedPlaceholders: true,
};

export const db = mysql.createPool(configuracionPool);
