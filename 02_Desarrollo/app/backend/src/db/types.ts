import type { RowDataPacket } from "mysql2";

export type UsuarioRow = RowDataPacket & {
  id_usuario: number;
  nombre: string;
  apellidos: string | null;
  login: string;
  password_hash: string;
  rol: string;
  activo: 0 | 1;
  ultimo_acceso: Date | null;
};

export type MaquinaRow = RowDataPacket & {
  id_maquina: number;
  id_lavanderia: number;
  codigo_visible: string;
  tipo_maquina: string;
  estado_actual: string;
  activa: 0 | 1;
  observaciones: string | null;
};

export type TarifaRow = RowDataPacket & {
  id_tarifa: number;
  id_lavanderia: number;
  nombre: string;
  precio_arranque: number;
  tiempo_base_minutos: number;
  importe_incremento: number;
  minutos_por_incremento: number;
};

export type CicloInsertResult = {
  id_ciclo: number;
};
