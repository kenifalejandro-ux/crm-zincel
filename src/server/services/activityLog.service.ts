/** src/server/services/activityLog.service.ts */

import { pool } from "../config/database";

export type TipoActividad =
  | "llamada" | "reunion" | "propuesta" | "brochure"
  | "tarea"   | "pipeline" | "score"    | "automatizacion" | "nota";

export interface RegistrarActividadInput {
  prospecto_id: string;
  tipo:         TipoActividad;
  titulo:       string;
  descripcion?: string;
  metadata?:    Record<string, unknown>;
  usuario_id?:  string;
}

export async function registrarActividad(input: RegistrarActividadInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO activity_logs (prospecto_id, tipo, titulo, descripcion, metadata, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.prospecto_id,
        input.tipo,
        input.titulo,
        input.descripcion ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.usuario_id ?? null,
      ]
    );
  } catch { /* nunca bloquea el flujo principal */ }
}

export async function obtenerTimelineService(prospectoId: string) {
  const result = await pool.query(
    `SELECT id, tipo, titulo, descripcion, metadata, usuario_id, creado_en
     FROM activity_logs
     WHERE prospecto_id = $1
     ORDER BY creado_en DESC
     LIMIT 100`,
    [prospectoId]
  );
  return result.rows;
}
