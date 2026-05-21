/**src/server/services/llamadas.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearLlamadaInput } from "../schemas/llamada.schema";
import { registrarActividad } from "./activityLog.service";

export async function crearLlamadaService(input: CrearLlamadaInput, usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const llamada = await client.query(
      `INSERT INTO llamadas (prospecto_id, fecha, hora_fin, canal, contestada, resultado, motivo_no_interes, notas, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.prospecto_id,
        input.fecha ?? new Date().toISOString(),
        input.hora_fin ?? null,
        input.canal ?? "llamada",
        input.contestada ?? false,
        input.resultado ?? null,
        input.motivo_no_interes ?? null,
        input.notas ?? null,
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

    // Trigger: llamada contestada + prospecto en 'nuevo' → avanzar a 'contactado'
    if (input.contestada) {
      await client.query(
        `UPDATE prospectos
         SET etapa_pipeline = 'contactado',
             clasificacion  = 'por_gestionar'
         WHERE id = $1
           AND etapa_pipeline = 'nuevo'`,
        [input.prospecto_id]
      );
    }

    await client.query("COMMIT");
    logger.info({ id: llamada.rows[0].id }, "Llamada registrada");

    // Setear fecha_primer_contacto solo si aún no tiene (primera llamada)
    void pool.query(
      `UPDATE prospectos SET fecha_primer_contacto = CURRENT_DATE
       WHERE id = $1 AND fecha_primer_contacto IS NULL`,
      [input.prospecto_id]
    );

    void registrarActividad({
      prospecto_id: input.prospecto_id,
      tipo:        "llamada",
      titulo:      input.contestada ? "Llamada contestada" : "Llamada no contestada",
      descripcion: input.notas ?? undefined,
      metadata:    { canal: input.canal, contestada: input.contestada, resultado: input.resultado },
      usuario_id:  usuarioId,
    });

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
export async function estadisticasLlamadasPorPeriodoService(
  fecha_inicio?: string,
  fecha_fin?: string,
  granularidad: "dia" | "hora" | "mes" = "dia"
) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (fecha_inicio) { condiciones.push(`fecha >= $${idx++}::timestamptz`); valores.push(fecha_inicio); }
  if (fecha_fin)    { condiciones.push(`fecha <  $${idx++}::timestamptz`); valores.push(fecha_fin); }

  const where    = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "WHERE fecha >= CURRENT_DATE - INTERVAL '90 days'";
  const groupBy  = granularidad === "hora"
    ? "EXTRACT(HOUR FROM fecha)::int"
    : granularidad === "mes"
    ? "EXTRACT(MONTH FROM fecha)::int"
    : "fecha::date";

  const result = await pool.query(`
    SELECT
      ${groupBy}                                                  AS periodo,
      COUNT(*)::int                                               AS total,
      COUNT(*) FILTER (WHERE contestada = true)::int             AS contestadas,
      COUNT(*) FILTER (WHERE contestada = false)::int            AS no_contestadas
    FROM llamadas
    ${where}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} ASC
  `, valores);

  return result.rows;
}


export async function heatmapLlamadasService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;
  if (filters?.fecha_inicio) { condiciones.push(`fecha >= $${idx++}`); valores.push(filters.fecha_inicio); }
  if (filters?.fecha_fin)    { condiciones.push(`fecha < $${idx++}`);  valores.push(filters.fecha_fin); }
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(`
    SELECT
      EXTRACT(HOUR FROM fecha)::int                                                    AS hora,
      COUNT(*)::int                                                                    AS total,
      COUNT(*) FILTER (WHERE contestada = true)::int                                  AS contestadas,
      ROUND(COUNT(*) FILTER (WHERE contestada = true) * 100.0 / NULLIF(COUNT(*),0))::int AS tasa
    FROM llamadas ${where}
    GROUP BY hora ORDER BY hora
  `, valores);
  return result.rows;
}

export async function actualizarLlamadaService(id: string, input: Record<string, any>) {
  const PERMITIDOS = ["canal", "contestada", "fecha", "hora_fin", "resultado", "motivo_no_interes", "notas"];
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
