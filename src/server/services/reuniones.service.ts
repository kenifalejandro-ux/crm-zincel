/**src/server/services/reuniones.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearReunionInput, ActualizarReunionInput } from "../schemas/reunion.schema";

export async function crearReunionService(input: CrearReunionInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO reuniones (prospecto_id, titulo, fecha_hora, modalidad, enlace, estado, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      input.prospecto_id, input.titulo, input.fecha_hora,
      input.modalidad ?? "google_meet", input.enlace,
      input.estado ?? "programada", input.notas, usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Reunión creada");
  return result.rows[0];
}

export async function obtenerReunionesService(filtros: {
  estado?: string;
  prospecto_id?: string;
  desde?: string;
  hasta?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.estado) {
    condiciones.push(`r.estado = $${idx++}`);
    valores.push(filtros.estado);
  }
  if (filtros.prospecto_id) {
    condiciones.push(`r.prospecto_id = $${idx++}`);
    valores.push(filtros.prospecto_id);
  }
  if (filtros.desde) {
    condiciones.push(`r.fecha_hora >= $${idx++}`);
    valores.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push(`r.fecha_hora <= $${idx++}`);
    valores.push(filtros.hasta);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT r.*, p.empresa, p.nombre_contacto, p.email_contacto
     FROM reuniones r
     LEFT JOIN prospectos p ON p.id = r.prospecto_id
     ${where}
     ORDER BY r.fecha_hora ASC`,
    valores
  );
  return result.rows;
}

export async function actualizarReunionService(id: string, input: ActualizarReunionInput) {
  const campos = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");

  const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map(campo => (input as any)[campo]);

  const result = await pool.query(
    `UPDATE reuniones SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Reunión no encontrada");
  logger.info({ id }, "Reunión actualizada");
  return result.rows[0];
}

export async function marcarEmailEnviadoService(id: string) {
  const result = await pool.query(
    `UPDATE reuniones SET email_enviado = true WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

export async function resumenReunionesService() {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE estado = 'programada') as programadas,
      COUNT(*) FILTER (WHERE estado = 'realizada') as realizadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
      COUNT(*) FILTER (WHERE estado = 'descartado') as descartadas,
      COUNT(*) FILTER (WHERE fecha_hora::date = CURRENT_DATE) as hoy,
      COUNT(*) FILTER (WHERE fecha_hora >= date_trunc('month', CURRENT_DATE)) as este_mes,
      modalidad,
      COUNT(*) as por_modalidad
    FROM reuniones
    GROUP BY modalidad
    ORDER BY total DESC
  `);
  return result.rows;
}
export async function eliminarReunionesMasivoService(ids: string[]) {
  if (!ids.length) return 0;

  const result = await pool.query(
    `DELETE FROM reuniones WHERE id = ANY($1::uuid[])`,
    [ids]
  );

  logger.info({ eliminados: result.rowCount }, "reuniones eliminados masivamente");
  return result.rowCount;
}