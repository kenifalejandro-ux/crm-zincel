/**src/server/routes/crm/prospectos.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearProspectoSchema, actualizarProspectoSchema } from "../../schemas/prospecto.schema";
import { eventBus, CRM_EVENTS } from "../../shared/events/eventBus";
import {
  crearProspectoService,
  obtenerProspectosService,
  obtenerProspectoPorIdService,
  actualizarProspectoService,
  eliminarProspectoService,
  importarProspectosService,
  eliminarProspectosMasivoService,
  motivosPerdidaService,
  getPipelineService,
  actualizarEtapaPipelineService,
  funnelPipelineService,
  analisisRegionService,
  scoreLeadsService,
  getScoreHistoryService,
  ciclodeVentaService,
  resumenProspectosService,
  upsertContactoService,
  eliminarContactoService,
  getEstadoWebDistribucionService,
  getAnalisisComercialService,
} from "../../services/prospecto.service";
import { invalidarCacheCRM } from "../../config/cache";

export const prospectosRouter = Router();

prospectosRouter.use(authMiddleware);

// GET /api/crm/prospectos/analisis-comercial
prospectosRouter.get("/analisis-comercial", async (_req, res) => {
  try {
    const data = await getAnalisisComercialService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/resumen
prospectosRouter.get("/resumen", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query as Record<string, string>;
    const data = await resumenProspectosService(fecha_desde || undefined, fecha_hasta || undefined);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/scores
prospectosRouter.get("/scores", async (req, res) => {
  try {
    const { periodo, mes, anio, fecha } = req.query as Record<string, string>;
    const data = await scoreLeadsService(
      periodo,
      mes  ? Number(mes)  : undefined,
      anio ? Number(anio) : undefined,
      fecha
    );
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/:id/score-history
prospectosRouter.get("/:id/score-history", async (req, res) => {
  try {
    const data = await getScoreHistoryService(req.params.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/analisis-llamadas
prospectosRouter.get("/analisis-llamadas", async (_req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const [actividad, cobertura, tendencia] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int                                                              AS total,
          COUNT(*) FILTER (WHERE contestada = true)::int                            AS contestadas,
          COUNT(*) FILTER (WHERE contestada = false)::int                           AS no_contestadas,
          COUNT(*) FILTER (WHERE resultado IS NULL)::int                            AS sin_resultado,
          COUNT(*) FILTER (WHERE resultado = 'no_interesado')::int                 AS no_interesado,
          COUNT(*) FILTER (WHERE resultado = 'interesado')::int                    AS interesado,
          COUNT(*) FILTER (WHERE resultado = 'no_contesta')::int                   AS no_contesta,
          COUNT(*) FILTER (WHERE resultado = 'volver_a_llamar')::int               AS volver_a_llamar,
          COUNT(*) FILTER (WHERE resultado::text = 'solicita_informacion')::int    AS solicita_informacion,
          COUNT(*) FILTER (WHERE resultado::text = 'numero_equivocado')::int       AS numero_equivocado,
          COUNT(*) FILTER (WHERE resultado::text = 'fuera_de_servicio')::int       AS fuera_de_servicio,
          COUNT(*) FILTER (WHERE resultado = 'buzon_de_voz')::int                  AS buzon_de_voz,
          COUNT(*) FILTER (WHERE resultado = 'ya_tiene_proveedor')::int            AS ya_tiene_proveedor
        FROM llamadas
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM llamadas l WHERE l.prospecto_id = p.id
          ))::int AS con_llamadas,
          COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM llamadas l WHERE l.prospecto_id = p.id
          ))::int AS sin_llamadas,
          COUNT(*)::int AS total_prospectos
        FROM prospectos p WHERE p.eliminado = false
      `),
      pool.query(`
        SELECT
          TO_CHAR(fecha, 'YYYY-MM') AS mes,
          COUNT(*)::int             AS total,
          COUNT(*) FILTER (WHERE contestada = true)::int  AS contestadas
        FROM llamadas
        GROUP BY mes
        ORDER BY mes DESC
        LIMIT 6
      `),
    ]);
    res.json({
      ok: true,
      data: {
        actividad:  actividad.rows[0],
        cobertura:  cobertura.rows[0],
        tendencia:  tendencia.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/funnel
prospectosRouter.get("/funnel", async (req, res) => {
  try {
    const data = await funnelPipelineService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/etapa-leads?etapa=xxx — prospectos de una etapa con info resumida
prospectosRouter.get("/etapa-leads", async (req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const { etapa } = req.query;
    if (!etapa || typeof etapa !== "string") {
      return res.status(400).json({ ok: false, message: "etapa requerida" });
    }
    // Mirror exact logic from funnelPipelineService effective-stage CTE
    const etapaCondition = (() => {
      switch (etapa) {
        case 'cerrado_ganado':
          return `EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'cerrada_ganada')`;
        case 'negociacion':
          return `EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'en_negociacion')`;
        case 'propuesta_enviada':
          return `EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'enviada')`;
        case 'perdido':
          return `EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado IN ('cerrada_perdida','vencida'))`;
        case 'interesado':
          return `NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
                  AND p.estado_lead = 'interesado'`;
        case 'solicita_informacion':
          return `NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
                  AND p.estado_lead::text = 'solicita_informacion'`;
        case 'volver_a_llamar':
          return `NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
                  AND p.estado_lead = 'volver_a_llamar'`;
        default:
          return `1 = 0`;
      }
    })();

    const result = await pool.query(`
      SELECT
        p.id, p.empresa, p.nombre_contacto, p.telefono, p.ciudad,
        p.etapa_pipeline, p.creado_en,
        COALESCE((
          SELECT MAX(l.fecha)::text FROM llamadas l WHERE l.prospecto_id = p.id
        ), NULL) AS ultima_llamada,
        COALESCE((
          SELECT COUNT(*)::int FROM propuestas pr WHERE pr.prospecto_id = p.id
        ), 0) AS total_propuestas,
        COALESCE((
          SELECT SUM(CASE WHEN pr.moneda='USD'
            THEN COALESCE(pr.monto_cerrado, pr.monto_propuesto)*pr.tipo_cambio
            ELSE COALESCE(pr.monto_cerrado, pr.monto_propuesto) END)
          FROM propuestas pr WHERE pr.prospecto_id = p.id
            AND pr.estado NOT IN ('cerrada_perdida','vencida')
        ), 0)::float AS valor_pipeline
      FROM prospectos p
      WHERE p.eliminado = false
        AND ${etapaCondition}
      ORDER BY p.creado_en DESC
      LIMIT 100
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/prospectos/:id/estado-lead — actualiza estado_lead al arrastrar en pre-pipeline
prospectosRouter.patch("/:id/estado-lead", async (req, res) => {
  try {
    const { pool }       = await import("../../config/database");
    const { estado_lead } = req.body;
    const PRE_PIPELINE   = ["volver_a_llamar","solicita_informacion","interesado"];
    if (!PRE_PIPELINE.includes(estado_lead)) {
      return res.status(400).json({ ok: false, message: "estado_lead no válido para pre-pipeline" });
    }
    await pool.query(
      `UPDATE prospectos SET estado_lead = $1::estado_lead, actualizado_en = NOW() WHERE id = $2`,
      [estado_lead, req.params.id]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/por-region
prospectosRouter.get("/por-region", async (req, res) => {
  try {
    const data = await analisisRegionService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/estado-web
prospectosRouter.get("/estado-web", async (_req, res) => {
  try {
    const data = await getEstadoWebDistribucionService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/motivos-perdida
prospectosRouter.get("/motivos-perdida", async (req, res) => {
  try {
    const data = await motivosPerdidaService();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/ciclo-venta?anio=2026
prospectosRouter.get("/ciclo-venta", async (req, res) => {
  try {
    const anio = req.query.anio ? parseInt(req.query.anio as string, 10) : undefined;
    const data = await ciclodeVentaService(anio);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/pipeline
prospectosRouter.get("/pipeline", async (req, res) => {
  try {
    const data = await getPipelineService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/prospectos/:id/etapa
prospectosRouter.patch("/:id/etapa", async (req, res) => {
  try {
    const { etapa } = req.body;
    if (!etapa) return res.status(400).json({ ok: false, message: "etapa requerida" });
    const data = await actualizarEtapaPipelineService(req.params.id, etapa, (req as any).usuario?.id);
    void invalidarCacheCRM();
    eventBus.publish(CRM_EVENTS.PROSPECTO_UPDATED, { id: req.params.id });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos
prospectosRouter.get("/", async (req, res) => {
  try {
    const filtros = {
      estado_lead:   req.query.estado_lead as string,
      clasificacion: req.query.clasificacion as string,
      prioridad:     req.query.prioridad as string,
      fuente:        req.query.fuente as string,
      busqueda:      req.query.busqueda as string,
      pagina:        req.query.pagina ? parseInt(req.query.pagina as string) : 1,//paginacion
      limite:        req.query.limite ? parseInt(req.query.limite as string) : 50,//paginacion
    };
    const result = await obtenerProspectosService(filtros);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/:id
prospectosRouter.get("/:id", async (req, res) => {
  try {
    const prospecto = await obtenerProspectoPorIdService(req.params.id);
    if (!prospecto) return res.status(404).json({ ok: false, message: "Prospecto no encontrado" });
    res.status(200).json({ ok: true, data: prospecto });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/prospectos
prospectosRouter.post("/", validate(crearProspectoSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearProspectoService(req.body, usuario.id);
    void invalidarCacheCRM();
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/prospectos/:id
prospectosRouter.put("/:id", validate(actualizarProspectoSchema), async (req, res) => {
  try {
    const data = await actualizarProspectoService(req.params.id, req.body);
    void invalidarCacheCRM();
    eventBus.publish(CRM_EVENTS.PROSPECTO_UPDATED, { id: req.params.id });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});


// DELETE /api/crm/prospectos/masivo
prospectosRouter.delete("/masivo", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "IDs inválidos",
      });
    }

    const eliminados = await eliminarProspectosMasivoService(ids);

    res.status(200).json({
      ok: true,
      eliminados,
    });

  } catch (err: any) {
    res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
});
// DELETE /api/crm/prospectos/:id
prospectosRouter.delete("/:id", async (req, res) => {
  try {
    const data = await eliminarProspectoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/prospectos/:id/contactos  — crear o actualizar contacto secundario
prospectosRouter.post("/:id/contactos", async (req, res) => {
  try {
    const { id: contactoId, nombre, cargo, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, message: "nombre requerido" });
    const data = await upsertContactoService(req.params.id, { id: contactoId, nombre, cargo, telefono, email });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/prospectos/:id/contactos/:cid
prospectosRouter.delete("/:id/contactos/:cid", async (req, res) => {
  try {
    await eliminarContactoService(req.params.cid, req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/prospectos/importar
prospectosRouter.post("/importar", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { prospectos } = req.body;
    if (!Array.isArray(prospectos) || prospectos.length === 0) {
      return res.status(400).json({ ok: false, message: "No hay prospectos para importar" });
    }
    const result = await importarProspectosService(prospectos, usuario.id);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/prospectos/:id/calidad — actualiza calidad_lead
prospectosRouter.patch("/:id/calidad", async (req, res) => {
  const { calidad_lead } = req.body;
  if (!["sin_calificar","calificado","no_calificado"].includes(calidad_lead)) {
    return res.status(400).json({ ok: false, message: "calidad_lead inválido" });
  }
  try {
    const { pool } = await import("../../config/database");
    await pool.query(
      `UPDATE prospectos SET calidad_lead = $1, actualizado_en = NOW() WHERE id = $2`,
      [calidad_lead, req.params.id]
    );
    res.json({ ok: true, calidad_lead });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/por-campana?fuente=facebook — leads agrupados por campaña con calidad y velocidad
prospectosRouter.get("/por-campana", async (req, res) => {
  const fuente = (req.query.fuente as string) || "facebook";
  try {
    const { pool } = await import("../../config/database");
    const { rows } = await pool.query(
      `SELECT
         COALESCE(p.campana_origen, 'Sin campaña')                        AS campana_origen,
         COUNT(*)                                                           AS total,
         COUNT(*) FILTER (WHERE p.calidad_lead = 'calificado')             AS calificados,
         COUNT(*) FILTER (WHERE p.calidad_lead = 'no_calificado')          AS no_calificados,
         COUNT(*) FILTER (WHERE p.calidad_lead = 'sin_calificar')          AS sin_calificar,
         COUNT(*) FILTER (WHERE ll.primera_llamada IS NULL)                AS sin_contactar,
         ROUND(AVG(
           EXTRACT(EPOCH FROM (ll.primera_llamada - p.creado_en)) / 60
         ) FILTER (WHERE ll.primera_llamada IS NOT NULL))::int              AS min_promedio_respuesta,
         COUNT(*) FILTER (
           WHERE ll.primera_llamada IS NOT NULL
           AND EXTRACT(EPOCH FROM (ll.primera_llamada - p.creado_en)) / 60 <= 5
         )                                                                  AS contactados_5min
       FROM prospectos p
       LEFT JOIN LATERAL (
         SELECT MIN(fecha) AS primera_llamada FROM llamadas l WHERE l.prospecto_id = p.id
       ) ll ON true
       WHERE p.fuente = $1 AND p.eliminado = false
       GROUP BY p.campana_origen
       ORDER BY total DESC`,
      [fuente]
    );
    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});