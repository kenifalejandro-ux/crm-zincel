/**src/server/services/llamadas.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearLlamadaInput } from "../schemas/llamada.schema";

export async function crearLlamadaService(input: CrearLlamadaInput, usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const llamada = await client.query(
      `INSERT INTO llamadas (prospecto_id, fecha, canal, contestada, duracion_minutos, resultado, notas, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.prospecto_id,
        input.fecha ?? new Date().toISOString(),
        input.canal ?? "llamada",
        input.contestada ?? false,
        input.duracion_minutos ?? 0,
        input.resultado,
        input.notas,
        usuarioId,
      ]
    );

    // Actualizar estado del prospecto si hay resultado
    if (input.resultado) {
      await client.query(
        `UPDATE prospectos SET estado_lead = $1 WHERE id = $2`,
        [input.resultado, input.prospecto_id]
      );
    }

    await client.query("COMMIT");
    logger.info({ id: llamada.rows[0].id }, "Llamada registrada");
    return llamada.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function obtenerLlamadasService(prospecto_id: string) {
  const result = await pool.query(
    `SELECT l.*, u.nombre as creado_por_nombre
     FROM llamadas l
     LEFT JOIN usuarios u ON u.id = l.creado_por
     WHERE l.prospecto_id = $1
     ORDER BY l.fecha DESC`,
    [prospecto_id]
  );
  return result.rows;
}

export async function obtenerTodasLlamadasService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filters?.fecha_inicio) {
    condiciones.push(`l.fecha >= $${idx++}`);
    valores.push(filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    condiciones.push(`l.fecha < $${idx++}`);
    valores.push(filters.fecha_fin);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT l.*, p.empresa, p.nombre_contacto
     FROM llamadas l
     LEFT JOIN prospectos p ON p.id = l.prospecto_id
     ${where}
     ORDER BY l.fecha DESC
     LIMIT 200`,
    valores
  );
  return result.rows;
}

export async function resumenLlamadasService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filters?.fecha_inicio) {
    condiciones.push(`fecha >= $${idx++}`);
    valores.push(filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    condiciones.push(`fecha < $${idx++}`);
    valores.push(filters.fecha_fin);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(`
    SELECT
      canal,
      COUNT(*) as por_canal,
      COUNT(*) FILTER (WHERE contestada = true) as contestadas,
      COUNT(*) FILTER (WHERE contestada = false) as no_contestadas
    FROM llamadas
    ${where}
    GROUP BY canal
  `, valores);
  return result.rows;
}
export async function estadisticasLlamadasPorPeriodoService(periodo: "dia" | "mes" | "semana") {
  let groupBy: string;

  switch (periodo) {
    case "dia":
      groupBy = "fecha::date";
      break;
    case "semana":
      groupBy = "date_trunc('week', fecha)";
      break;
    case "mes":
      groupBy = "date_trunc('month', fecha)";
      break;
  }

  const result = await pool.query(`
    SELECT
      ${groupBy} as periodo,
      COUNT(*) as total_llamadas,
      COUNT(*) FILTER (WHERE contestada = true) as contestadas,
      COUNT(*) FILTER (WHERE contestada = false) as no_contestadas
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} DESC
    LIMIT 50
  `);

  return result.rows.map(row => ({
    periodo: row.periodo,
    total: parseInt(row.total_llamadas),
    contestadas: parseInt(row.contestadas),
    no_contestadas: parseInt(row.no_contestadas),
  }));
}


export async function actualizarLlamadaService(id: string, input: Record<string, any>) {
  const PERMITIDOS = ["canal", "contestada", "duracion_minutos", "resultado", "notas"];
  const campos = Object.keys(input).filter((k) => PERMITIDOS.includes(k));
  if (campos.length === 0) return null;

  const sets   = campos.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const valores = campos.map((c) => input[c]);

  const result = await pool.query(
    `UPDATE llamadas SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`,
    [...valores, id]
  );
  return result.rows[0] ?? null;
}
