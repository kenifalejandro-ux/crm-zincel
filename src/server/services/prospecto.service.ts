/**src/server/services/prospecto.service.ts */

import { pool } from "../config/database";
import { registrarActividad } from "./activityLog.service";
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
      input.estado_lead ?? "por_gestionar", input.clasificacion ?? "por_gestionar",
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
  } else if (filtros.estado_lead === "no_contesta") {
    // Solo leads con llamadas reales donde no contestaron (excluye los que nunca se llamaron)
    condiciones.push(`p.estado_lead = 'no_contesta' AND EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id)`);
  } else if (filtros.estado_lead === "por_gestionar") {
    // Leads sin ninguna actividad: estado_lead::text = 'por_gestionar' (post-migration)
    // O estado_lead = 'no_contesta' sin ninguna llamada (pre-migration)
    condiciones.push(`(p.estado_lead::text = 'por_gestionar' OR (p.estado_lead = 'no_contesta' AND NOT EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id)))`);
  } else if (filtros.estado_lead === "nuevo") {
    condiciones.push(`p.estado_lead::text = 'nuevo'`);
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
        json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas,
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) AS contactos
       FROM prospectos p
       LEFT JOIN llamadas l ON l.prospecto_id = p.id
       LEFT JOIN reuniones r ON r.prospecto_id = p.id
       LEFT JOIN brochures b ON b.prospecto_id = p.id
       LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
       LEFT JOIN contactos c ON c.prospecto_id = p.id
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
      json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas,
      json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) AS contactos
     FROM prospectos p
     LEFT JOIN llamadas l ON l.prospecto_id = p.id
     LEFT JOIN reuniones r ON r.prospecto_id = p.id
     LEFT JOIN brochures b ON b.prospecto_id = p.id
     LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
     LEFT JOIN contactos c ON c.prospecto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function upsertContactoService(
  prospectoId: string,
  contacto: { id?: string; nombre: string; cargo?: string; telefono?: string; email?: string }
) {
  if (contacto.id) {
    const result = await pool.query(
      `UPDATE contactos SET nombre=$1, cargo=$2, telefono=$3, email=$4
       WHERE id=$5 AND prospecto_id=$6 RETURNING *`,
      [contacto.nombre, contacto.cargo ?? null, contacto.telefono ?? null, contacto.email ?? null, contacto.id, prospectoId]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO contactos (prospecto_id, nombre, cargo, telefono, email)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [prospectoId, contacto.nombre, contacto.cargo ?? null, contacto.telefono ?? null, contacto.email ?? null]
    );
    return result.rows[0];
  }
}

export async function eliminarContactoService(id: string, prospectoId: string) {
  await pool.query(`DELETE FROM contactos WHERE id=$1 AND prospecto_id=$2`, [id, prospectoId]);
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
      p.ciudad, p.rubro, p.notas,
      p.creado_en, p.actualizado_en,
      (SELECT pr.servicio FROM propuestas pr
       WHERE pr.prospecto_id = p.id
         AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
       ORDER BY pr.creado_en DESC LIMIT 1) AS servicio_propuesta,
      COALESCE((
        SELECT SUM(
          CASE WHEN pr.moneda = 'USD'
            THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio, 1)
            ELSE pr.monto_propuesto
          END
        )
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
          AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
      ), 0)::float AS valor_pipeline,
      COALESCE((
        SELECT SUM(pr.monto_propuesto)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
          AND pr.moneda = 'PEN'
          AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
      ), 0)::float AS valor_pipeline_pen,
      COALESCE((
        SELECT SUM(pr.monto_propuesto)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
          AND pr.moneda = 'USD'
          AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
      ), 0)::float AS valor_pipeline_usd
    FROM prospectos p
    ORDER BY p.etapa_pipeline, p.creado_en DESC
  `);

  const etapas = ["nuevo","contactado","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"];
  const pipeline: Record<string, { prospectos: any[]; total: number; valor: number; valor_pen: number; valor_usd: number }> = {};
  for (const e of etapas) {
    pipeline[e] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
  }
  for (const row of result.rows) {
    const etapa = row.etapa_pipeline ?? "nuevo";
    if (!pipeline[etapa]) pipeline[etapa] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
    pipeline[etapa].prospectos.push(row);
    pipeline[etapa].total++;
    pipeline[etapa].valor     += Number(row.valor_pipeline     ?? 0);
    pipeline[etapa].valor_pen += Number(row.valor_pipeline_pen ?? 0);
    pipeline[etapa].valor_usd += Number(row.valor_pipeline_usd ?? 0);
  }
  return pipeline;
}

export async function actualizarEtapaPipelineService(id: string, etapa: string) {
  // Leer etapa anterior para saber si venimos de un estado finalizado
  const prev = await pool.query(
    `SELECT etapa_pipeline FROM prospectos WHERE id = $1`,
    [id]
  );
  const etapaAnterior = prev.rows[0]?.etapa_pipeline ?? "";

  // Definir estado_venta y clasificacion según la nueva etapa
  const ESTADO_VENTA_MAP: Record<string, string> = {
    nuevo:             "no",
    contactado:        "no",
    interesado:        "en_proceso",
    propuesta_enviada: "en_proceso",
    negociacion:       "en_proceso",
    cerrado_ganado:    "si",
    perdido:           "no",
  };
  const CLASIFICACION_MAP: Record<string, string> = {
    nuevo:             "por_gestionar",
    contactado:        "por_gestionar",
    interesado:        "gestionado",
    propuesta_enviada: "gestionado",
    negociacion:       "gestionado",
    cerrado_ganado:    "cerrado",
    perdido:           "por_gestionar",
  };

  const sets: string[] = [
    "etapa_pipeline = $2",
    "actualizado_en = now()",
    `estado_venta = '${ESTADO_VENTA_MAP[etapa] ?? "en_proceso"}'`,
    `clasificacion = '${CLASIFICACION_MAP[etapa] ?? "activo"}'`,
  ];
  const vals: any[] = [id, etapa];

  if (etapa === "cerrado_ganado") {
    sets.push("fecha_cierre = CURRENT_DATE");
  } else if (["cerrado_ganado", "perdido"].includes(etapaAnterior)) {
    // Revertir: limpiar fecha_cierre si venimos de un estado finalizado
    sets.push("fecha_cierre = NULL");
  }

  const result = await pool.query(
    `UPDATE prospectos SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    vals
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");

  // ── Sincronizar propuesta: si venimos de cerrado/perdido, reabrir la última ──
  const PROPUESTA_MAP: Record<string, string> = {
    propuesta_enviada: "enviada",
    negociacion:       "en_negociacion",
    cerrado_ganado:    "cerrada_ganada",
    perdido:           "cerrada_perdida",
  };
  const nuevoPropuestaEstado = PROPUESTA_MAP[etapa];
  if (nuevoPropuestaEstado) {
    if (["cerrado_ganado", "perdido"].includes(etapaAnterior)) {
      // Reabrir la última propuesta que estaba cerrada
      void pool.query(
        `UPDATE propuestas
         SET estado = $2
         WHERE id = (
           SELECT id FROM propuestas
           WHERE prospecto_id = $1
           ORDER BY fecha_propuesta DESC
           LIMIT 1
         )`,
        [id, nuevoPropuestaEstado]
      ).catch(() => {});
    } else {
      // Solo actualizar propuestas activas
      void pool.query(
        `UPDATE propuestas
         SET estado = $2
         WHERE id = (
           SELECT id FROM propuestas
           WHERE prospecto_id = $1
             AND estado NOT IN ('cerrada_ganada', 'cerrada_perdida', 'vencida')
           ORDER BY fecha_propuesta DESC
           LIMIT 1
         )`,
        [id, nuevoPropuestaEstado]
      ).catch(() => {});
    }
  }

  const ETAPA_LABEL: Record<string, string> = {
    nuevo:              "Nuevo lead",
    contactado:         "Lead contactado",
    interesado:         "Lead interesado",
    propuesta_enviada:  "Propuesta enviada",
    negociacion:        "En negociación",
    cerrado_ganado:     "¡Venta cerrada! 🎉",
    perdido:            "Lead perdido",
  };
  void registrarActividad({
    prospecto_id: id,
    tipo:        "pipeline",
    titulo:      ETAPA_LABEL[etapa] ?? `Movido a ${etapa}`,
    metadata:    { etapa },
  });

  return result.rows[0];
}

export async function resumenProspectosService() {
  const [leads, llamadas] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                                             AS total,
        COUNT(*) FILTER (WHERE estado_lead::text = 'nuevo')::int                 AS nuevo,
        COUNT(*) FILTER (WHERE estado_lead::text = 'por_gestionar')::int         AS por_gestionar,
        COUNT(*) FILTER (WHERE estado_lead = 'interesado')::int                  AS interesado,
        COUNT(*) FILTER (WHERE estado_lead = 'no_contesta')::int                 AS no_contesta,
        COUNT(*) FILTER (WHERE estado_lead = 'volver_a_llamar')::int             AS volver_a_llamar,
        COUNT(*) FILTER (WHERE estado_lead = 'no_interesado')::int               AS no_interesado,
        COUNT(*) FILTER (WHERE estado_lead = 'buzon_de_voz')::int                AS buzon_de_voz,
        COUNT(*) FILTER (WHERE estado_lead::text IN (
          'interesado','no_interesado','volver_a_llamar','ya_tiene_proveedor'
        ))::int                                                                   AS leads_contactados
      FROM prospectos p
    `),
    pool.query(`
      SELECT
        COUNT(*)::int                                          AS total_llamadas,
        COUNT(*) FILTER (WHERE contestada = true)::int        AS llamadas_contestadas,
        COUNT(*) FILTER (WHERE contestada = false)::int       AS llamadas_no_contestadas
      FROM llamadas
    `),
  ]);

  return {
    ...leads.rows[0],
    // Métricas de llamadas (iguales al dashboard)
    total_llamadas:          llamadas.rows[0].total_llamadas,
    llamadas_contestadas:    llamadas.rows[0].llamadas_contestadas,
    llamadas_no_contestadas: llamadas.rows[0].llamadas_no_contestadas,
    // Alias para compatibilidad con la card "Contestadas"
    contestadas: llamadas.rows[0].llamadas_contestadas,
  };
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
    SELECT p.etapa_pipeline,
           COUNT(*)::int AS total,
           COALESCE(SUM((
             SELECT COALESCE(SUM(
               CASE WHEN pr.moneda = 'USD'
                 THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio, 1)
                 ELSE pr.monto_propuesto
               END
             ), 0)
             FROM propuestas pr
             WHERE pr.prospecto_id = p.id
               AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
           )), 0)::float AS valor
    FROM prospectos p
    GROUP BY p.etapa_pipeline
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
      COALESCE(SUM((
        SELECT COALESCE(SUM(
          CASE WHEN pr.moneda = 'USD'
            THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio, 1)
            ELSE pr.monto_propuesto
          END
        ), 0)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
          AND pr.estado NOT IN ('cerrada_perdida', 'vencida')
      )), 0)::float AS valor
    FROM prospectos p
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

    // Leads que eran "nuevo" de la carga anterior → pasan a "por_gestionar"
    await client.query(
      `UPDATE prospectos SET estado_lead = 'por_gestionar' WHERE estado_lead = 'nuevo'`
    );

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
          "nuevo", p.clasificacion ?? "por_gestionar",
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
        + CASE p.estado_lead::text
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
        + LEAST(10, COALESCE(act7.cnt, 0) * 3)
        -- Solo penalizar inactividad si el lead ya fue llamado antes (no castiga base fría)
        - CASE
            WHEN COALESCE(act30.cnt, 0) = 0
             AND EXISTS (SELECT 1 FROM llamadas lh WHERE lh.prospecto_id = p.id)
            THEN 15
            ELSE 0
          END
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

export async function ciclodeVentaService() {
  // KPIs globales + promedios por fase
  const kpis = await pool.query(`
    WITH base AS (
      SELECT
        p.id,
        (p.fecha_cierre - p.fecha_primer_contacto)::int                                         AS dias_total,
        ((SELECT MIN(pr.fecha_propuesta) FROM propuestas pr WHERE pr.prospecto_id = p.id)
          - p.fecha_primer_contacto)::int                                                        AS dias_contacto_propuesta,
        (p.fecha_cierre -
          (SELECT MIN(pr.fecha_propuesta) FROM propuestas pr WHERE pr.prospecto_id = p.id))::int AS dias_propuesta_cierre
      FROM prospectos p
      WHERE p.etapa_pipeline = 'cerrado_ganado'
        AND p.fecha_cierre IS NOT NULL
        AND p.fecha_primer_contacto IS NOT NULL
        AND p.eliminado = false
    )
    SELECT
      COUNT(*)::int                               AS total_cerrados,
      ROUND(AVG(dias_total))::int                 AS promedio_dias,
      MIN(dias_total)::int                        AS min_dias,
      MAX(dias_total)::int                        AS max_dias,
      ROUND(AVG(dias_contacto_propuesta))::int    AS promedio_contacto_propuesta,
      ROUND(AVG(dias_propuesta_cierre))::int      AS promedio_propuesta_cierre
    FROM base
    WHERE dias_contacto_propuesta >= 0 AND dias_propuesta_cierre >= 0
  `);

  // Por rubro (top 8)
  const porRubro = await pool.query(`
    SELECT
      COALESCE(rubro, 'Sin rubro')               AS rubro,
      COUNT(*)::int                              AS total,
      ROUND(AVG(fecha_cierre - fecha_primer_contacto))::int AS promedio_dias
    FROM prospectos
    WHERE etapa_pipeline = 'cerrado_ganado'
      AND fecha_cierre IS NOT NULL
      AND fecha_primer_contacto IS NOT NULL
      AND eliminado = false
    GROUP BY rubro
    ORDER BY total DESC
    LIMIT 8
  `);

  // Prospectos activos en riesgo: llevan más días que el promedio sin cerrar
  const promedio = kpis.rows[0]?.promedio_dias ?? null;
  const enRiesgo = promedio
    ? await pool.query(
        `SELECT
           id, empresa, nombre_contacto, etapa_pipeline,
           fecha_primer_contacto::text,
           (CURRENT_DATE - fecha_primer_contacto)::int AS dias_en_pipeline
         FROM prospectos
         WHERE etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
           AND fecha_primer_contacto IS NOT NULL
           AND eliminado = false
           AND (CURRENT_DATE - fecha_primer_contacto) > $1
         ORDER BY dias_en_pipeline DESC
         LIMIT 10`,
        [promedio]
      )
    : { rows: [] };

  // Detalle individual — todos los cierres con fases
  const detalle = await pool.query(`
    SELECT
      p.id,
      p.empresa,
      p.nombre_contacto,
      p.rubro,
      p.fecha_primer_contacto::text,
      p.fecha_cierre::text,
      (p.fecha_cierre - p.fecha_primer_contacto)::int                                          AS dias_ciclo,
      (SELECT MIN(pr.fecha_propuesta) FROM propuestas pr WHERE pr.prospecto_id = p.id)::text   AS fecha_primera_propuesta,
      ((SELECT MIN(pr.fecha_propuesta) FROM propuestas pr WHERE pr.prospecto_id = p.id)
        - p.fecha_primer_contacto)::int                                                        AS dias_contacto_propuesta,
      (p.fecha_cierre -
        (SELECT MIN(pr.fecha_propuesta) FROM propuestas pr WHERE pr.prospecto_id = p.id))::int AS dias_propuesta_cierre,
      COALESCE((
        SELECT SUM(
          CASE WHEN pr.moneda = 'USD'
            THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio, 1)
            ELSE pr.monto_propuesto
          END
        )
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
      ), 0)::float AS valor_cerrado
    FROM prospectos p
    WHERE p.etapa_pipeline = 'cerrado_ganado'
      AND p.fecha_cierre IS NOT NULL
      AND p.fecha_primer_contacto IS NOT NULL
      AND p.eliminado = false
    ORDER BY p.fecha_cierre DESC
  `);

  // Tendencia mensual — últimos 12 meses
  const tendencia = await pool.query(`
    SELECT
      TO_CHAR(fecha_cierre, 'YYYY-MM') AS mes,
      COUNT(*)::int                    AS cerrados,
      ROUND(AVG(fecha_cierre - fecha_primer_contacto))::int AS promedio_dias
    FROM prospectos
    WHERE etapa_pipeline = 'cerrado_ganado'
      AND fecha_cierre IS NOT NULL
      AND fecha_primer_contacto IS NOT NULL
      AND fecha_cierre >= CURRENT_DATE - INTERVAL '12 months'
      AND eliminado = false
    GROUP BY mes
    ORDER BY mes ASC
  `);

  return {
    kpis: {
      total_cerrados:              kpis.rows[0]?.total_cerrados              ?? 0,
      promedio_dias:               kpis.rows[0]?.promedio_dias               ?? null,
      min_dias:                    kpis.rows[0]?.min_dias                    ?? null,
      max_dias:                    kpis.rows[0]?.max_dias                    ?? null,
      promedio_contacto_propuesta: kpis.rows[0]?.promedio_contacto_propuesta ?? null,
      promedio_propuesta_cierre:   kpis.rows[0]?.promedio_propuesta_cierre   ?? null,
    },
    por_rubro:  porRubro.rows,
    en_riesgo:  enRiesgo.rows,
    tendencia:  tendencia.rows,
    detalle:    detalle.rows,
  };
}
