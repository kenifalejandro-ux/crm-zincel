/** src/server/services/inicio.service.ts */

import { pool } from "../config/database";

export async function getResumenInicioService(usuarioId: string) {

  const [tareasRes, reunionesRes, estancadosRes, prioridadRes, leadsRes] = await Promise.all([

    // Tareas pendientes hoy y vencidas
    pool.query(`
      SELECT
        COUNT(CASE WHEN fecha_vencimiento = CURRENT_DATE THEN 1 END)::int AS pendientes_hoy,
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE  THEN 1 END)::int AS vencidas,
        json_agg(
          json_build_object(
            'id', id,
            'titulo', titulo,
            'fecha_vencimiento', fecha_vencimiento::text
          ) ORDER BY fecha_vencimiento ASC
        ) FILTER (WHERE fecha_vencimiento <= CURRENT_DATE + 2) AS proximas
      FROM tareas
      WHERE completada = false
        AND creado_por = $1
    `, [usuarioId]),

    // Reuniones de hoy (excluye solo canceladas y descartadas)
    pool.query(`
      SELECT r.id, r.titulo, r.fecha_hora::text, r.hora_fin::text, r.modalidad, r.estado, p.empresa, p.nombre_contacto
      FROM reuniones r
      JOIN prospectos p ON p.id = r.prospecto_id
      WHERE DATE(r.fecha_hora) = CURRENT_DATE
        AND r.estado NOT IN ('cancelada', 'reprogramada')
        AND r.creado_por = $1
      ORDER BY r.fecha_hora ASC
      LIMIT 5
    `, [usuarioId]),

    // Leads estancados +14 días
    pool.query(`
      SELECT COUNT(*)::int AS total
      FROM prospectos p
      WHERE p.clasificacion NOT IN ('cerrado', 'descartado')
        AND p.creado_por = $1
        AND p.eliminado = false
        AND (
          (SELECT MAX(al.creado_en) FROM activity_logs al WHERE al.prospecto_id = p.id)
            < NOW() - INTERVAL '14 days'
          OR NOT EXISTS (SELECT 1 FROM activity_logs al WHERE al.prospecto_id = p.id)
        )
    `, [usuarioId]),

    // Acciones críticas y urgentes
    pool.query(`
      SELECT
        COUNT(CASE WHEN nivel = 'critica'  THEN 1 END)::int AS criticos,
        COUNT(CASE WHEN nivel = 'urgente'  THEN 1 END)::int AS urgentes
      FROM (
        SELECT
          CASE
            WHEN (CURRENT_DATE - p.fecha_primer_contacto) > 90 THEN 'critica'
            WHEN (CURRENT_DATE - p.fecha_primer_contacto) > 45 THEN 'urgente'
            ELSE 'pendiente'
          END AS nivel
        FROM prospectos p
        WHERE p.etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
          AND p.eliminado = false
          AND p.fecha_primer_contacto IS NOT NULL
          AND p.creado_por = $1
      ) sub
    `, [usuarioId]),

    // Top 5 leads calientes por score
    pool.query(`
      SELECT
        p.id, p.empresa, p.nombre_contacto, p.telefono,
        p.etapa_pipeline, p.ciudad,
        COALESCE(
          (SELECT SUM(monto_propuesto) FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado NOT IN ('cerrada_perdida','vencida')),
          0
        )::float AS valor_pipeline
      FROM prospectos p
      WHERE p.clasificacion NOT IN ('cerrado', 'descartado')
        AND p.eliminado = false
        AND p.etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
        AND p.creado_por = $1
      ORDER BY
        CASE p.etapa_pipeline
          WHEN 'negociacion'       THEN 1
          WHEN 'propuesta_enviada' THEN 2
          WHEN 'interesado'        THEN 3
          WHEN 'contactado'        THEN 4
          ELSE 5
        END ASC,
        valor_pipeline DESC
      LIMIT 5
    `, [usuarioId]),

  ]);

  const t = tareasRes.rows[0];
  const p = prioridadRes.rows[0];

  return {
    tareas: {
      pendientes_hoy: t?.pendientes_hoy ?? 0,
      vencidas:       t?.vencidas       ?? 0,
      proximas:       t?.proximas        ?? [],
    },
    reuniones_hoy:  reunionesRes.rows,
    alertas: {
      estancados: estancadosRes.rows[0]?.total ?? 0,
      criticos:   p?.criticos ?? 0,
      urgentes:   p?.urgentes ?? 0,
    },
    leads_calientes: leadsRes.rows,
  };
}
