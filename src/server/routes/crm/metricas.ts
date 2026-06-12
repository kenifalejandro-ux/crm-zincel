/**src/server/routes/crm/metricas */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { MetricaSchema, type MetricaInput } from "../../schemas/metricas.schema";
import {
  crearMetricaService,
  listarMetricasService,
  obtenerMetricaPorIdService,
  actualizarMetricaService,
  eliminarMetricaService,
  eliminarMetricasMasivoService,
  resumenMetricasService,
  getProyectosService,
  asignarProyectosBulkService,
  actualizarProyectosMetricaService,
  refreshMetricaService,
} from "../../services/metricas.service";

export const metricasRouter = Router();

metricasRouter.use(authMiddleware);

metricasRouter.get("/", async (req, res) => {
  try {
    const { empresa, plataforma, sub_plataforma, desde, hasta, proyecto } = req.query as Record<string, string>;
    const data = await listarMetricasService({ empresa, plataforma, sub_plataforma, desde, hasta, proyecto });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/empresas — lista empresas únicas con campañas registradas
metricasRouter.get("/empresas", async (_req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const { rows } = await pool.query(
      `SELECT DISTINCT empresa FROM campana_metricas WHERE empresa IS NOT NULL ORDER BY empresa`
    );
    res.json({ ok: true, data: rows.map((r: any) => r.empresa) });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/proyectos?empresa=X — lista proyectos únicos para el selector
metricasRouter.get("/proyectos", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const data = await getProyectosService(empresa);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /metricas/bulk-proyecto — asigna proyectos (array) a múltiples campañas
metricasRouter.put("/bulk-proyecto", async (req, res) => {
  try {
    const { ids, proyectos } = req.body as { ids: string[]; proyectos: string[] };
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ ok: false, message: "ids requerido" });
    await asignarProyectosBulkService(ids, proyectos ?? []);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /metricas/:id/proyectos — actualiza proyectos de una campaña individual
metricasRouter.put("/:id/proyectos", async (req, res) => {
  try {
    const { proyectos } = req.body as { proyectos: string[] };
    await actualizarProyectosMetricaService(req.params.id, proyectos ?? []);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/por-proyecto?empresa=X
metricasRouter.get("/por-proyecto", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const { pool } = await import("../../config/database");
    const where  = empresa ? `AND cm.empresa ILIKE $1` : "";
    const params = empresa ? [`%${empresa}%`] : [];

    const { rows } = await pool.query(`
      WITH dedicadas AS (
        -- Solo campañas asignadas a UN único proyecto
        SELECT
          cm.proyectos[1]          AS proyecto,
          COUNT(DISTINCT cm.id)::int AS campanas,
          SUM(cm.gasto)            AS gasto,
          SUM(cm.leads)::int       AS leads,
          SUM(cm.clics)::int       AS clics
        FROM campana_metricas cm
        WHERE cardinality(cm.proyectos) = 1 ${where}
        GROUP BY cm.proyectos[1]
      ),
      generales AS (
        -- Campañas compartidas entre varios proyectos
        SELECT
          COUNT(DISTINCT cm.id)::int AS campanas,
          SUM(cm.gasto)              AS gasto,
          SUM(cm.leads)::int         AS leads,
          SUM(cm.clics)::int         AS clics
        FROM campana_metricas cm
        WHERE cardinality(cm.proyectos) > 1 ${where}
      ),
      venta_stats AS (
        SELECT
          CASE
            WHEN rc.proyecto ILIKE '%Alborada%'  THEN 'Alborada'
            WHEN rc.proyecto ILIKE '%Villa%'      THEN 'Terrenos Villa'
            WHEN rc.proyecto ILIKE '%Fernando%'   THEN 'San Fernando'
            ELSE rc.proyecto
          END           AS proyecto,
          COUNT(*)::int AS ventas,
          SUM(rc.monto) AS revenue
        FROM resultados_campana rc
        WHERE rc.proyecto IS NOT NULL
        GROUP BY 1
      )
      SELECT
        d.proyecto,
        d.campanas,
        d.gasto,
        d.leads,
        d.clics,
        COALESCE(vs.ventas,  0) AS ventas,
        COALESCE(vs.revenue, 0) AS revenue,
        CASE WHEN d.gasto > 0
          THEN ROUND(COALESCE(vs.revenue,0) / d.gasto, 1)
          ELSE 0 END            AS roas_real,
        CASE WHEN d.leads > 0
          THEN ROUND(d.gasto / d.leads, 2)
          ELSE NULL END         AS cpl,
        false                   AS es_general
      FROM dedicadas d
      LEFT JOIN venta_stats vs ON vs.proyecto = d.proyecto

      UNION ALL

      SELECT
        'General (multi-proyecto)' AS proyecto,
        g.campanas, g.gasto, g.leads, g.clics,
        0 AS ventas, 0 AS revenue, 0 AS roas_real, NULL AS cpl,
        true AS es_general
      FROM generales g
      WHERE g.campanas > 0

      ORDER BY es_general, gasto DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/ciclo?empresa=X
metricasRouter.get("/ciclo", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const { pool } = await import("../../config/database");
    const w = empresa ? `WHERE cm.empresa ILIKE $1` : "";
    const p = empresa ? [`%${empresa}%`] : [];

    // Campañas atribuidas a ventas (con ciclo)
    const { rows: ciclos } = await pool.query(`
      SELECT
        cm.id            AS metrica_id,
        cm.campana_nombre,
        cm.periodo_inicio::text,
        cm.periodo_fin::text,
        cm.proyectos,
        cm.gasto,
        r.id             AS resultado_id,
        r.fecha_venta::text,
        r.monto,
        r.proyecto       AS proyecto_venta,
        r.confianza_atribucion,
        (r.fecha_venta - cm.periodo_inicio) AS dias_ciclo
      FROM campana_metricas cm
      JOIN resultado_campana_rel rcr ON rcr.metrica_id = cm.id
      JOIN resultados_campana r      ON r.id = rcr.resultado_id
      ${w}
      ORDER BY r.fecha_venta, cm.periodo_inicio
    `, p);

    // Todas las campañas para el Gantt
    const { rows: campanas } = await pool.query(`
      SELECT id, campana_nombre, periodo_inicio::text, periodo_fin::text, proyectos, gasto
      FROM campana_metricas cm ${w}
      ORDER BY periodo_inicio
    `, p);

    // Todas las ventas para los marcadores
    const { rows: ventas } = await pool.query(`
      SELECT id, fecha_venta::text, monto, proyecto
      FROM resultados_campana
      ORDER BY fecha_venta
    `);

    res.json({ ok: true, data: { ciclos, campanas, ventas } });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.get("/resumen", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const data = await resumenMetricasService(empresa);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/atribucion?empresa=X
// Cruza campana_metricas con prospectos.campana_origen para ver CPL real y funnel
// GET /metricas/formatos?empresa=X
// Compara métricas e ingresos entre Tráfico/WhatsApp e Instáform
metricasRouter.get("/formatos", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const { pool } = await import("../../config/database");
    const whereEmpresa = empresa ? `WHERE LOWER(empresa) ILIKE '%' || LOWER($1) || '%'` : "";
    const params = empresa ? [empresa] : [];

    const { rows } = await pool.query(
      `WITH campanas AS (
        SELECT
          id,
          campana_nombre,
          CASE WHEN leads > 0 THEN 'instáform' ELSE 'trafico_mensajes' END AS formato,
          gasto, impresiones, clics, mensajes, leads, ctr, cpm, cpc, frecuencia
        FROM campana_metricas
        ${whereEmpresa}
      ),
      formato_agg AS (
        SELECT
          formato,
          COUNT(DISTINCT campana_nombre)::int                      AS campanas,
          SUM(gasto)::numeric(12,2)                                AS gasto_total,
          SUM(impresiones)::bigint                                 AS impresiones_total,
          SUM(clics)::int                                          AS clics_total,
          SUM(mensajes)::int                                       AS mensajes_total,
          SUM(leads)::int                                          AS leads_total,
          ROUND(AVG(NULLIF(ctr,0))::numeric, 2)                   AS ctr_promedio,
          ROUND(AVG(NULLIF(cpm,0))::numeric, 2)                   AS cpm_promedio,
          ROUND(AVG(NULLIF(cpc,0))::numeric, 2)                   AS cpc_promedio,
          ROUND(AVG(NULLIF(frecuencia,0))::numeric, 2)            AS frecuencia_promedio
        FROM campanas
        GROUP BY formato
      ),
      revenue_agg AS (
        SELECT
          c.formato,
          COUNT(DISTINCT rc.id)::int                              AS ventas,
          COALESCE(SUM(rc.monto),0)::numeric(12,2)               AS revenue_total,
          COALESCE(SUM(rc.costo_venta),0)::numeric(12,2)         AS costo_venta_total
        FROM campanas c
        LEFT JOIN resultados_campana rc ON rc.metrica_id = c.id
        GROUP BY c.formato
      )
      SELECT
        fa.formato,
        fa.campanas,
        fa.gasto_total,
        fa.impresiones_total,
        fa.clics_total,
        fa.mensajes_total,
        fa.leads_total,
        fa.ctr_promedio,
        fa.cpm_promedio,
        fa.cpc_promedio,
        fa.frecuencia_promedio,
        COALESCE(ra.ventas, 0)          AS ventas,
        COALESCE(ra.revenue_total, 0)   AS revenue_total,
        COALESCE(ra.costo_venta_total,0)AS costo_venta_total,
        -- Costo por resultado
        CASE WHEN fa.mensajes_total > 0
          THEN ROUND(fa.gasto_total / fa.mensajes_total, 2) ELSE NULL END AS costo_por_mensaje,
        CASE WHEN fa.leads_total > 0
          THEN ROUND(fa.gasto_total / fa.leads_total, 2) ELSE NULL END    AS costo_por_lead,
        -- Tasa de respuesta por 1000 impresiones
        CASE WHEN fa.impresiones_total > 0
          THEN ROUND((fa.mensajes_total::numeric / fa.impresiones_total * 1000), 2) ELSE NULL END AS mensajes_por_1000_imp,
        CASE WHEN fa.impresiones_total > 0
          THEN ROUND((fa.leads_total::numeric / fa.impresiones_total * 1000), 2) ELSE NULL END    AS leads_por_1000_imp,
        -- Rentabilidad
        CASE WHEN COALESCE(ra.revenue_total,0) > 0 AND fa.gasto_total > 0
          THEN ROUND(ra.revenue_total / fa.gasto_total, 2) ELSE NULL END  AS roas_real,
        CASE WHEN COALESCE(ra.ventas,0) > 0 AND fa.gasto_total > 0
          THEN ROUND(fa.gasto_total / ra.ventas, 2) ELSE NULL END         AS costo_por_venta,
        -- Margen
        CASE WHEN COALESCE(ra.revenue_total,0) > 0
          THEN ROUND(((ra.revenue_total - ra.costo_venta_total) / ra.revenue_total * 100)::numeric, 1)
          ELSE NULL END AS margen_pct
      FROM formato_agg fa
      LEFT JOIN revenue_agg ra ON ra.formato = fa.formato
      ORDER BY fa.gasto_total DESC`,
      params
    );

    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/historico-plataforma?empresa=X
// Devuelve CPL, gasto y leads históricos agrupados por plataforma — base del Budget Optimizer
metricasRouter.get("/historico-plataforma", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const { pool } = await import("../../config/database");
    const whereEmpresa = empresa ? `WHERE LOWER(empresa) ILIKE '%' || LOWER($1) || '%'` : "";
    const params = empresa ? [empresa] : [];

    const { rows } = await pool.query(
      `SELECT
        plataforma,
        COUNT(DISTINCT campana_nombre)::int                                   AS campanas,
        ROUND(SUM(gasto)::numeric, 2)                                         AS gasto_total,
        SUM(leads)::int                                                        AS leads_total,
        SUM(clics)::int                                                        AS clics_total,
        SUM(impresiones)::bigint                                               AS impresiones_total,
        SUM(mensajes)::int                                                     AS mensajes_total,
        -- CPL calculado solo sobre campañas que generaron leads (excluye spend de branding/tráfico)
        CASE WHEN SUM(leads) > 0
          THEN ROUND((SUM(gasto) FILTER (WHERE leads > 0) / SUM(leads))::numeric, 2)
          ELSE 0 END                                                           AS cpl_promedio,
        CASE WHEN SUM(clics) > 0
          THEN ROUND((SUM(gasto) / SUM(clics))::numeric, 2)
          ELSE 0 END                                                           AS cpc_promedio,
        CASE WHEN SUM(impresiones) > 0
          THEN ROUND((SUM(clics)::numeric / SUM(impresiones) * 100)::numeric, 2)
          ELSE 0 END                                                           AS ctr_promedio,
        COUNT(DISTINCT TO_CHAR(periodo_inicio, 'YYYY-MM'))::int               AS meses_con_datos,
        MIN(periodo_inicio)                                                    AS fecha_inicio,
        MAX(periodo_fin)                                                       AS fecha_fin
      FROM campana_metricas
      ${whereEmpresa}
      GROUP BY plataforma
      ORDER BY gasto_total DESC`,
      params
    );
    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /metricas/alertas?empresa=X
// Detecta anomalías: CPL disparado, frecuencia alta, CTR en caída, sin datos recientes
metricasRouter.get("/alertas", async (req, res) => {
  try {
    const { empresa } = req.query as { empresa?: string };
    const { pool } = await import("../../config/database");
    const whereEmpresa = empresa ? `AND LOWER(empresa) ILIKE '%' || LOWER($1) || '%'` : "";
    const params = empresa ? [empresa] : [];

    const { rows } = await pool.query(
      `WITH base AS (
        SELECT
          campana_nombre, plataforma, empresa,
          periodo_inicio, periodo_fin,
          gasto, leads, clics, impresiones, frecuencia,
          CASE WHEN clics > 0 THEN ROUND((clics::numeric / NULLIF(impresiones,0) * 100), 2) ELSE 0 END AS ctr_calc,
          CASE WHEN leads > 0 THEN ROUND((gasto / leads)::numeric, 2) ELSE 0 END AS cpl_calc
        FROM campana_metricas
        WHERE 1=1 ${whereEmpresa}
      ),
      promedios AS (
        SELECT
          plataforma,
          AVG(NULLIF(cpl_calc, 0))  AS cpl_promedio,
          AVG(NULLIF(ctr_calc, 0))  AS ctr_promedio,
          AVG(NULLIF(frecuencia, 0)) AS frecuencia_promedio
        FROM base
        GROUP BY plataforma
      ),
      alertas_cpl AS (
        SELECT b.campana_nombre, b.plataforma, b.empresa, b.periodo_fin,
          'cpl_alto' AS tipo,
          'CPL ' || b.cpl_calc::text || ' — ' ||
            ROUND(((b.cpl_calc - p.cpl_promedio) / NULLIF(p.cpl_promedio,0) * 100)::numeric,0)::text
            || '% sobre el promedio de la plataforma' AS mensaje,
          b.cpl_calc AS valor
        FROM base b
        JOIN promedios p ON b.plataforma = p.plataforma
        WHERE b.cpl_calc > 0
          AND p.cpl_promedio > 0
          AND b.cpl_calc > p.cpl_promedio * 1.5
      ),
      alertas_frecuencia AS (
        SELECT campana_nombre, plataforma, empresa, periodo_fin,
          'frecuencia_alta' AS tipo,
          'Frecuencia ' || frecuencia::text || ' — riesgo de fatiga de audiencia (límite recomendado: 3.5)' AS mensaje,
          frecuencia AS valor
        FROM base
        WHERE frecuencia > 3.5
      ),
      alertas_ctr AS (
        SELECT b.campana_nombre, b.plataforma, b.empresa, b.periodo_fin,
          'ctr_bajo' AS tipo,
          'CTR ' || b.ctr_calc::text || '% — '||
            ROUND(((p.ctr_promedio - b.ctr_calc) / NULLIF(p.ctr_promedio,0) * 100)::numeric,0)::text
            || '% por debajo del promedio' AS mensaje,
          b.ctr_calc AS valor
        FROM base b
        JOIN promedios p ON b.plataforma = p.plataforma
        WHERE b.ctr_calc > 0
          AND p.ctr_promedio > 0
          AND b.ctr_calc < p.ctr_promedio * 0.5
      )
      SELECT * FROM alertas_cpl
      UNION ALL SELECT * FROM alertas_frecuencia
      UNION ALL SELECT * FROM alertas_ctr
      ORDER BY periodo_fin DESC
      LIMIT 20`,
      params
    );
    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.get("/:id", async (req, res) => {
  try {
    const data = await obtenerMetricaPorIdService(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: "No encontrada" });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.post("/", validate(MetricaSchema), async (req, res) => {
  try {
    const data = await crearMetricaService(req.validatedBody as MetricaInput);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarMetricaService(req.params.id, req.body);
    if (!data) return res.status(404).json({ ok: false, message: "No encontrada" });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.delete("/masivo", async (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ ok: false, message: "ids requerido" });
    const eliminados = await eliminarMetricasMasivoService(ids);
    res.status(200).json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metricasRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarMetricaService(req.params.id);
    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /metricas/:id/refresh — jala datos frescos de la plataforma y actualiza el registro
metricasRouter.post("/:id/refresh", async (req, res) => {
  try {
    const data = await refreshMetricaService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    const status = err.message?.includes("No tiene platform_campaign_id") ? 422 : 500;
    res.status(status).json({ ok: false, message: err.message });
  }
});
