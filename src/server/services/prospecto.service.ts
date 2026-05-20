/**src/server/services/prospecto.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearProspectoInput, ActualizarProspectoInput } from "../schemas/prospecto.schema";

export async function crearProspectoService(input: CrearProspectoInput, usuarioId: string) {
  const webActiva = input.web_activa === true
    ? true
    : String(input.web_activa).toLowerCase() === "true"
      ? true
      : input.web_activa === false || String(input.web_activa).toLowerCase() === "false"
        ? false
        : undefined;

  const result = await pool.query(
    `INSERT INTO prospectos (
      empresa, rubro, tamano_empresa, pagina_web, web_activa, proveedor_web,
      nombre_contacto, cargo, telefono, email_contacto,
      ciudad, region, pais,
      prioridad, fuente, estado_lead, clasificacion, estado_venta,
      notas, creado_por
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
    ) RETURNING *`,
    [
      input.empresa, input.rubro, input.tamano_empresa, input.pagina_web,
      input.web_activa, input.proveedor_web, input.nombre_contacto, input.cargo,
      input.telefono, input.email_contacto, input.ciudad, input.region,
      input.pais ?? "Perú", input.prioridad ?? "media", input.fuente,
      input.estado_lead ?? "no_contesta", input.clasificacion ?? "por_gestionar",
      input.estado_venta ?? "no", input.notas, usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Prospecto creado");
  return result.rows[0];
}

export async function obtenerProspectosService(filtros: {
  estado_lead?: string;
  clasificacion?: string;
  prioridad?: string;
  fuente?: string;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.estado_lead === "contestada") {
    condiciones.push(`EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id AND ll2.contestada = true)`);
  } else if (filtros.estado_lead) {
    condiciones.push(`p.estado_lead = $${idx++}`);
    valores.push(filtros.estado_lead);
  }
  if (filtros.clasificacion) {
    condiciones.push(`p.clasificacion = $${idx++}`);
    valores.push(filtros.clasificacion);
  }
  if (filtros.prioridad) {
    condiciones.push(`p.prioridad = $${idx++}`);
    valores.push(filtros.prioridad);
  }
  if (filtros.fuente) {
    condiciones.push(`p.fuente = $${idx++}`);
    valores.push(filtros.fuente);
  }
  if (filtros.busqueda) {
    condiciones.push(`(
      p.empresa ILIKE $${idx} OR
      p.nombre_contacto ILIKE $${idx} OR
      p.telefono ILIKE $${idx} OR
      p.email_contacto ILIKE $${idx}
    )`);
    valores.push(`%${filtros.busqueda}%`);
    idx++;
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limite = filtros.limite ?? 50;
  const offset = ((filtros.pagina ?? 1) - 1) * limite;

  const [data, total] = await Promise.all([
    pool.query(
      `SELECT p.*,
        json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) AS llamadas,
        json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL) AS reuniones,
        json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) AS brochures,
        json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas
       FROM prospectos p
       LEFT JOIN llamadas l ON l.prospecto_id = p.id
       LEFT JOIN reuniones r ON r.prospecto_id = p.id
       LEFT JOIN brochures b ON b.prospecto_id = p.id
       LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
       ${where}
       GROUP BY p.id
       ORDER BY p.creado_en DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...valores, limite, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM prospectos p ${where}`,
      valores
    ),
  ]);

  return {
    data: data.rows,
    total: parseInt(total.rows[0].count),
    pagina: filtros.pagina ?? 1,
    limite,
  };
}

export async function obtenerProspectoPorIdService(id: string) {
  const result = await pool.query(
    `SELECT p.*,
      json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) AS llamadas,
      json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL) AS reuniones,
      json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) AS brochures,
      json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas
     FROM prospectos p
     LEFT JOIN llamadas l ON l.prospecto_id = p.id
     LEFT JOIN reuniones r ON r.prospecto_id = p.id
     LEFT JOIN brochures b ON b.prospecto_id = p.id
     LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function actualizarProspectoService(id: string, input: ActualizarProspectoInput) {
  const campos = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");

  const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map(campo => (input as any)[campo]);

  const result = await pool.query(
    `UPDATE prospectos SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");
  logger.info({ id }, "Prospecto actualizado");
  return result.rows[0];
}
{/**eliminar masivo  */}
export async function eliminarProspectoService(id: string) {
  const result = await pool.query(
    `DELETE FROM prospectos WHERE id = $1 RETURNING id`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");
  logger.info({ id }, "Prospecto eliminado");
  return { eliminado: true };
}

export async function getPipelineService() {
  const result = await pool.query(`
    SELECT
      p.id, p.empresa, p.nombre_contacto, p.telefono, p.email_contacto,
      p.estado_lead, p.prioridad, p.etapa_pipeline,
      p.valor_estimado, p.ciudad, p.rubro, p.notas,
      p.creado_en, p.actualizado_en
    FROM prospectos p
    WHERE p.etapa_pipeline != 'perdido' OR p.etapa_pipeline = 'perdido'
    ORDER BY p.etapa_pipeline, p.creado_en DESC
  `);

  const etapas = ["nuevo","contactado","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"];
  const pipeline: Record<string, { prospectos: any[]; total: number; valor: number }> = {};
  for (const e of etapas) {
    pipeline[e] = { prospectos: [], total: 0, valor: 0 };
  }
  for (const row of result.rows) {
    const etapa = row.etapa_pipeline ?? "nuevo";
    if (!pipeline[etapa]) pipeline[etapa] = { prospectos: [], total: 0, valor: 0 };
    pipeline[etapa].prospectos.push(row);
    pipeline[etapa].total++;
    pipeline[etapa].valor += Number(row.valor_estimado ?? 0);
  }
  return pipeline;
}

export async function actualizarEtapaPipelineService(id: string, etapa: string, valor_estimado?: number | null) {
  const sets: string[] = ["etapa_pipeline = $2", "actualizado_en = now()"];
  const vals: any[]    = [id, etapa];
  if (valor_estimado !== undefined) {
    sets.push(`valor_estimado = $${vals.length + 1}`);
    vals.push(valor_estimado);
  }
  const result = await pool.query(
    `UPDATE prospectos SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    vals
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");
  return result.rows[0];
}

export async function motivosPerdidaService() {
  const result = await pool.query(`
    SELECT motivo_perdida, COUNT(*)::int AS total
    FROM prospectos
    WHERE motivo_perdida IS NOT NULL
    GROUP BY motivo_perdida
    ORDER BY total DESC
  `);
  return result.rows;
}

const ORDEN_ETAPAS = ["nuevo","contactado","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"];

export async function funnelPipelineService() {
  const result = await pool.query(`
    SELECT etapa_pipeline,
           COUNT(*)::int                          AS total,
           COALESCE(SUM(valor_estimado),0)::float AS valor
    FROM prospectos
    GROUP BY etapa_pipeline
  `);

  const byEtapa: Record<string, { total: number; valor: number }> = {};
  for (const row of result.rows) {
    byEtapa[row.etapa_pipeline] = { total: row.total, valor: row.valor };
  }

  return ORDEN_ETAPAS.map((etapa, i) => {
    const { total = 0, valor = 0 } = byEtapa[etapa] ?? {};
    const prevTotal = i > 0 ? (byEtapa[ORDEN_ETAPAS[i - 1]]?.total ?? 0) : null;
    const conversion = prevTotal && prevTotal > 0 && etapa !== "perdido"
      ? Math.round((total / prevTotal) * 100)
      : null;
    return { etapa, total, valor, conversion };
  });
}

export async function analisisRegionService() {
  const result = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(region),''), NULLIF(TRIM(ciudad),''), 'Sin región') AS zona,
      COUNT(*)::int                                                              AS total,
      COUNT(*) FILTER (WHERE etapa_pipeline = 'cerrado_ganado')::int            AS cerrados,
      COUNT(*) FILTER (WHERE etapa_pipeline NOT IN ('perdido','cerrado_ganado'))::int AS activos,
      COALESCE(SUM(valor_estimado),0)::float                                    AS valor
    FROM prospectos
    GROUP BY zona
    ORDER BY total DESC
    LIMIT 20
  `);
  return result.rows;
}

export async function eliminarProspectosMasivoService(ids: string[]) {
  if (!ids.length) return 0;

  const result = await pool.query(
    `
    DELETE FROM prospectos
    WHERE id = ANY($1)
    RETURNING id
    `,
    [ids]
  );

  return result.rowCount;
}

export async function importarProspectosService(prospectos: any[], usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertados: any[] = [];

    for (const p of prospectos) {
      const webActiva = p.web_activa === true
        ? true
        : String(p.web_activa || "").toLowerCase().trim() === "true"
          ? true
          : p.web_activa === false || String(p.web_activa || "").toLowerCase().trim() === "false"
            ? false
            : undefined;

      const result = await client.query(
        `INSERT INTO prospectos (
          empresa, rubro, tamano_empresa, pagina_web, web_activa, proveedor_web,
          nombre_contacto, cargo, telefono, email_contacto,
          ciudad, region, pais, prioridad, fuente,
          estado_lead, clasificacion, estado_venta, notas, creado_por
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING id`,
        [
          p.empresa, p.rubro, p.tamano_empresa, p.pagina_web, webActiva,
          p.proveedor_web, p.nombre_contacto, p.cargo, p.telefono, p.email_contacto,
          p.ciudad, p.region, p.pais ?? "Perú", p.prioridad ?? "media", p.fuente,
          p.estado_lead ?? "no_contesta", p.clasificacion ?? "por_gestionar",
          p.estado_venta ?? "no", p.notas, usuarioId,
        ]
      );
      const prospectoId = result.rows[0]?.id;
      if (!prospectoId) continue;

      if (Array.isArray(p.llamadas)) {
        for (const llamada of p.llamadas) {
          // Validar fecha
          const fechaLlamada = llamada.fecha;
          if (fechaLlamada) {
            const date = new Date(fechaLlamada);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar llamada con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO llamadas (prospecto_id, fecha, canal, contestada, duracion_minutos, resultado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              prospectoId,
              fechaLlamada || new Date().toISOString(),
              llamada.canal ?? "llamada",
              llamada.contestada ?? false,
              llamada.duracion_minutos ?? 0,
              llamada.resultado,
              llamada.notas,
              usuarioId,
            ]
          );
        }
      }

      if (Array.isArray(p.brochures)) {
        for (const brochure of p.brochures) {
          // Validar fecha si existe
          const fechaEnvio = brochure.fecha_envio;
          if (fechaEnvio) {
            const date = new Date(fechaEnvio);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar brochure con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO brochures (prospecto_id, canal, fecha_envio, enviado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              prospectoId,
              brochure.canal ?? "correo",
              fechaEnvio || new Date().toISOString(),
              brochure.enviado ?? true,
              brochure.notas,
              usuarioId,
            ]
          );
        }
      }

      if (Array.isArray(p.reuniones)) {
        for (const reunion of p.reuniones) {
          // Validar fecha_hora
          const fechaHora = reunion.fecha_hora;
          if (fechaHora) {
            const date = new Date(fechaHora);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar reunión con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO reuniones (prospecto_id, titulo, fecha_hora, modalidad, enlace, estado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              prospectoId,
              reunion.titulo ?? "Reunión importada",
              fechaHora || new Date().toISOString(),
              reunion.modalidad ?? "google_meet",
              reunion.enlace,
              reunion.estado ?? "programada",
              reunion.notas,
              usuarioId,
            ]
          );
        }
      }

      insertados.push(prospectoId);
    }

    await client.query("COMMIT");
    logger.info({ total: insertados.length }, "Importación masiva completada");
    return { insertados: insertados.length, total: prospectos.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─── Score de leads ───────────────────────────────────────────────────────────

export interface ScoreLead {
  id:     string;
  score:  number;
  nivel:  "caliente" | "activo" | "tibio" | "frio";
}

export async function scoreLeadsService(): Promise<ScoreLead[]> {
  const result = await pool.query(`
    WITH act7 AS (
      SELECT prospecto_id, COUNT(*)::int AS cnt
      FROM llamadas WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY prospecto_id
    ),
    act30 AS (
      SELECT prospecto_id, COUNT(*)::int AS cnt
      FROM llamadas WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY prospecto_id
    ),
    prop_data AS (
      SELECT prospecto_id,
        MAX(CASE WHEN estado = 'aceptada' THEN 2
                 WHEN estado = 'enviada'  THEN 1
                 ELSE 0 END)::int AS nivel
      FROM propuestas GROUP BY prospecto_id
    )
    SELECT
      p.id,
      LEAST(100, GREATEST(0,
        CASE p.etapa_pipeline
          WHEN 'nuevo'             THEN 5
          WHEN 'contactado'        THEN 15
          WHEN 'interesado'        THEN 40
          WHEN 'propuesta_enviada' THEN 60
          WHEN 'negociacion'       THEN 75
          WHEN 'cerrado_ganado'    THEN 100
          WHEN 'perdido'           THEN 0
          ELSE 5
        END
        + CASE p.estado_lead
            WHEN 'interesado'      THEN 10
            WHEN 'volver_a_llamar' THEN 5
            WHEN 'no_contesta'     THEN -10
            WHEN 'no_interesado'   THEN -20
            ELSE 0
          END
        + CASE p.prioridad
            WHEN 'alta'  THEN 10
            WHEN 'media' THEN 5
            ELSE 0
          END
        + LEAST(10, COALESCE(a7.cnt, 0) * 3)
        - CASE WHEN COALESCE(a30.cnt, 0) = 0 THEN 15 ELSE 0 END
        + COALESCE(CASE pr.nivel WHEN 2 THEN 15 WHEN 1 THEN 5 ELSE 0 END, 0)
      ))::int AS score
    FROM prospectos p
    LEFT JOIN act7     ON act7.prospecto_id = p.id
    LEFT JOIN act30    ON act30.prospecto_id = p.id
    LEFT JOIN prop_data pr ON pr.prospecto_id = p.id
    ORDER BY score DESC
  `);

  const leads = result.rows.map(r => ({
    id:    r.id,
    score: r.score,
    nivel: (r.score >= 75 ? "caliente"
          : r.score >= 50 ? "activo"
          : r.score >= 25 ? "tibio"
          : "frio") as "caliente" | "activo" | "tibio" | "frio",
  }));

  // Snapshot diario — upsert para no duplicar si se llama varias veces al día
  if (leads.length > 0) {
    const ids    = leads.map(l => l.id);
    const scores = leads.map(l => l.score);
    const niveles = leads.map(l => l.nivel);
    await pool.query(
      `INSERT INTO score_history (prospecto_id, score, nivel, registrado_en)
       SELECT unnest($1::uuid[]), unnest($2::int[]), unnest($3::text[]), CURRENT_DATE
       ON CONFLICT (prospecto_id, registrado_en)
       DO UPDATE SET score = EXCLUDED.score, nivel = EXCLUDED.nivel`,
      [ids, scores, niveles]
    ).catch(() => {}); // tabla puede no existir aún — no rompe la respuesta
  }

  return leads;
}

export interface ScoreHistoryEntry {
  score:         number;
  nivel:         string;
  registrado_en: string;
}

export async function getScoreHistoryService(prospectoId: string): Promise<ScoreHistoryEntry[]> {
  const result = await pool.query(
    `SELECT score, nivel, registrado_en::text
     FROM score_history
     WHERE prospecto_id = $1
     ORDER BY registrado_en DESC
     LIMIT 10`,
    [prospectoId]
  );
  return result.rows;
}
