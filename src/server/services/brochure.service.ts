/** src/server/services/brochure.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import { registrarActividad } from "./activityLog.service";

export async function crearBrochureService(
  input: { prospecto_id: string; canal: string; notas?: string; fecha_envio?: string },
  usuarioId: string
) {
  const result = await pool.query(
    `INSERT INTO brochures (prospecto_id, canal, notas, fecha_envio, creado_por)
     VALUES ($1,$2,$3, COALESCE($4::timestamptz, now()), $5) RETURNING *`,
    [input.prospecto_id, input.canal, input.notas, input.fecha_envio ?? null, usuarioId]
  );
  logger.info({ id: result.rows[0].id }, "Brochure registrado");

  void registrarActividad({
    prospecto_id: input.prospecto_id,
    tipo:        "brochure",
    titulo:      `Brochure enviado por ${input.canal}`,
    descripcion: input.notas ?? undefined,
    metadata:    { canal: input.canal },
    usuario_id:  usuarioId,
  });

  return result.rows[0];
}

export async function obtenerBrochuresService(filters?: {
  prospecto_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filters?.prospecto_id) { condiciones.push(`b.prospecto_id = $${idx++}`); valores.push(filters.prospecto_id); }
  if (filters?.fecha_inicio)  { condiciones.push(`b.fecha_envio >= $${idx++}`); valores.push(filters.fecha_inicio); }
  if (filters?.fecha_fin)     { condiciones.push(`b.fecha_envio <  $${idx++}`); valores.push(filters.fecha_fin); }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

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
  input: { canal?: string; notas?: string; fecha_envio?: string }
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

export async function estadisticasBrochuresPorPeriodoService(
  fecha_inicio?: string,
  fecha_fin?: string,
  granularidad: "dia" | "hora" | "mes" = "dia"
) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (fecha_inicio) { condiciones.push(`fecha_envio >= $${idx++}::timestamptz`); valores.push(fecha_inicio); }
  if (fecha_fin)    { condiciones.push(`fecha_envio <  $${idx++}::timestamptz`); valores.push(fecha_fin); }

  const where   = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "WHERE fecha_envio >= CURRENT_DATE - INTERVAL '90 days'";
  const groupBy = granularidad === "hora"
    ? "EXTRACT(HOUR FROM fecha_envio)::int"
    : granularidad === "mes"
    ? "EXTRACT(MONTH FROM fecha_envio)::int"
    : "fecha_envio::date";

  const result = await pool.query(`
    SELECT
      ${groupBy}       AS periodo,
      COUNT(*)::int    AS total
    FROM brochures
    ${where}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} ASC
  `, valores);

  return result.rows;
}

export async function resumenBrochuresFiltradoService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filters?.fecha_inicio) { condiciones.push(`fecha_envio >= $${idx++}`); valores.push(filters.fecha_inicio); }
  if (filters?.fecha_fin)    { condiciones.push(`fecha_envio <  $${idx++}`); valores.push(filters.fecha_fin); }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [kpisResult, canalResult] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS total FROM brochures ${where}
    `, valores),
    pool.query(`
      SELECT canal, COUNT(*)::int AS total
      FROM brochures ${where}
      GROUP BY canal ORDER BY total DESC
    `, valores),
  ]);

  return {
    total: kpisResult.rows[0]?.total ?? 0,
    canales: canalResult.rows,
  };
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