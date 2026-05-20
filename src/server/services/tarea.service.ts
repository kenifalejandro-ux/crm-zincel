/**src/server/services/tarea.service.ts */

import { pool }   from "../config/database";
import { logger } from "../config/logger";
import type { CrearTareaInput, ActualizarTareaInput } from "../schemas/tarea.schema";

export async function crearTareaService(input: CrearTareaInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO tareas (prospecto_id, titulo, descripcion, fecha_vencimiento, creado_por)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [input.prospecto_id ?? null, input.titulo, input.descripcion ?? null, input.fecha_vencimiento, usuarioId]
  );
  logger.info({ id: result.rows[0].id }, "Tarea creada");
  return result.rows[0];
}

export async function obtenerTareasService(filtros: {
  prospecto_id?: string;
  solo_pendientes?: boolean;
  usuario_id?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.prospecto_id) {
    condiciones.push(`t.prospecto_id = $${idx++}`);
    valores.push(filtros.prospecto_id);
  }
  if (filtros.solo_pendientes) {
    condiciones.push(`t.completada = false`);
  }
  if (filtros.usuario_id) {
    condiciones.push(`t.creado_por = $${idx++}`);
    valores.push(filtros.usuario_id);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT t.*, p.empresa, p.nombre_contacto
     FROM tareas t
     LEFT JOIN prospectos p ON p.id = t.prospecto_id
     ${where}
     ORDER BY t.completada ASC, t.fecha_vencimiento ASC`,
    valores
  );
  return result.rows;
}

export async function completarTareaService(id: string) {
  const result = await pool.query(
    `UPDATE tareas SET completada = true, completada_en = now()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Tarea no encontrada");
  return result.rows[0];
}

export async function actualizarTareaService(id: string, input: ActualizarTareaInput) {
  const campos  = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("Sin campos para actualizar");
  const sets    = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const valores = campos.map(c => (input as any)[c]);
  const result  = await pool.query(
    `UPDATE tareas SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Tarea no encontrada");
  return result.rows[0];
}

export async function eliminarTareaService(id: string) {
  await pool.query(`DELETE FROM tareas WHERE id = $1`, [id]);
  return { eliminado: true };
}

export async function resumenTareasPendientesService(usuarioId: string) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE fecha_vencimiento < CURRENT_DATE)::int  AS vencidas,
       COUNT(*) FILTER (WHERE fecha_vencimiento = CURRENT_DATE)::int  AS hoy,
       COUNT(*) FILTER (WHERE fecha_vencimiento > CURRENT_DATE)::int  AS proximas,
       COUNT(*)::int                                                   AS total
     FROM tareas
     WHERE completada = false AND creado_por = $1`,
    [usuarioId]
  );
  return result.rows[0];
}
