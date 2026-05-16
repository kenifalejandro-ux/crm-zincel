/** src/server/services/brochure.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";

export async function crearBrochureService(
  input: { prospecto_id: string; canal: string; notas?: string },
  usuarioId: string
) {
  const result = await pool.query(
    `INSERT INTO brochures (prospecto_id, canal, notas, creado_por)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.prospecto_id, input.canal, input.notas, usuarioId]
  );
  logger.info({ id: result.rows[0].id }, "Brochure registrado");
  return result.rows[0];
}

export async function obtenerBrochuresService(prospecto_id?: string) {
  const where = prospecto_id ? "WHERE b.prospecto_id = $1" : "";
  const valores = prospecto_id ? [prospecto_id] : [];

  const result = await pool.query(
    `SELECT b.*, p.empresa, p.nombre_contacto
     FROM brochures b
     LEFT JOIN prospectos p ON p.id = b.prospecto_id
     ${where}
     ORDER BY b.fecha_envio DESC`,
    valores
  );
  return result.rows;
}

export async function resumenBrochuresService() {
  const result = await pool.query(`
    SELECT
      canal,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE fecha_envio::date = CURRENT_DATE) as hoy,
      COUNT(*) FILTER (WHERE fecha_envio >= date_trunc('month', CURRENT_DATE)) as este_mes
    FROM brochures
    GROUP BY canal
    ORDER BY total DESC
  `);
  return result.rows;
}

// ── NUEVO ─────────────────────────────────────────────────────────────────────

export async function actualizarBrochureService(
  id: string,
  input: { canal?: string; notas?: string }
) {
  const campos = Object.keys(input) as (keyof typeof input)[];
  if (campos.length === 0) return null;

  const sets = campos.map((c, i) => `${String(c)} = $${i + 1}`).join(", ");
  const valores = campos.map((c) => input[c]);

  const result = await pool.query(
    `UPDATE brochures SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`,
    [...valores, id]
  );
  return result.rows[0] ?? null;
}

export async function eliminarBrochuresMasivoService(ids: string[]) {
  if (!ids.length) return 0;

  const result = await pool.query(
    `DELETE FROM brochures WHERE id = ANY($1::uuid[])`,
    [ids]
  );

  logger.info({ eliminados: result.rowCount }, "Brochures eliminados masivamente");
  return result.rowCount;
}