/** src/server/services/notificaciones.service.ts */

import { pool } from "../config/database";

export interface Notificacion {
  id:         string;
  usuario_id: string;
  tipo:       string;
  titulo:     string;
  cuerpo:     string | null;
  url:        string | null;
  leida:      boolean;
  creado_en:  string;
  metadata:   Record<string, unknown>;
}

export async function crearNotificacion(data: {
  usuario_id: string;
  tipo:       string;
  titulo:     string;
  cuerpo?:    string;
  url?:       string;
  metadata?:  Record<string, unknown>;
}): Promise<void> {
  await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.usuario_id, data.tipo, data.titulo, data.cuerpo ?? null, data.url ?? null, data.metadata ?? {}]
  );
}

export async function obtenerNotificaciones(usuarioId: string): Promise<Notificacion[]> {
  const result = await pool.query(
    `SELECT * FROM notificaciones
     WHERE usuario_id = $1
     ORDER BY creado_en DESC
     LIMIT 30`,
    [usuarioId]
  );
  return result.rows;
}

export async function contarNoLeidas(usuarioId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM notificaciones WHERE usuario_id = $1 AND leida = false`,
    [usuarioId]
  );
  return result.rows[0].total;
}

export async function marcarLeida(id: string, usuarioId: string): Promise<void> {
  await pool.query(
    `UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
}

export async function marcarTodasLeidas(usuarioId: string): Promise<void> {
  await pool.query(
    `UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false`,
    [usuarioId]
  );
}

/** Evita duplicados: devuelve true si ya existe una notif del mismo tipo+clave hoy */
export async function yaNotificadoHoy(usuarioId: string, tipo: string, claveUnica: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM notificaciones
     WHERE usuario_id = $1
       AND tipo = $2
       AND metadata->>'clave' = $3
       AND creado_en::date = CURRENT_DATE
     LIMIT 1`,
    [usuarioId, tipo, claveUnica]
  );
  return (result.rowCount ?? 0) > 0;
}
