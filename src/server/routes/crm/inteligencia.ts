/** src/server/routes/crm/inteligencia.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  actividadKPIsService,
  insightsAutomaticosService,
  leadsEstancadosService,
  prioridadOperacionalService,
  forecastingService,
  forecastLeadsService,
  getObjetivosService,
  actualizarObjetivosService,
  tendenciasService,
  leadesPrioridadService,
  abandonoPipelineService,
  rechazosDualesService,
  tiempoPrimeraRespuestaService,
  forecastIngresosService,
  tasaConversionFunnelService,
  canalEfectividadService,
  inteligenciaConversacionService,
  leadsScoreNivelService,
  leadsPorEstadoService,
  leadsPorPaqueteWebService,
  forecastHistoricoService,
} from "../../services/inteligencia.service";

export const inteligenciaRouter = Router();
inteligenciaRouter.use(authMiddleware);

// GET /api/crm/inteligencia/actividad?fecha_inicio=&fecha_fin=
inteligenciaRouter.get("/actividad", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query as Record<string, string>;
    const data = await actividadKPIsService({ fecha_inicio, fecha_fin });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/insights
inteligenciaRouter.get("/insights", async (req, res) => {
  try {
    const data = await insightsAutomaticosService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/prioridad
inteligenciaRouter.get("/prioridad", async (req, res) => {
  try {
    const data = await prioridadOperacionalService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/prioridad-leads?tipo=sin_propuesta
inteligenciaRouter.get("/prioridad-leads", async (req, res) => {
  try {
    const tipo = req.query.tipo as string;
    if (!tipo) return res.status(400).json({ ok: false, message: "tipo requerido" });
    const data = await leadesPrioridadService(tipo);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/forecast
inteligenciaRouter.get("/forecast", async (req, res) => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const [forecast, objetivos] = await Promise.all([
      forecastingService(),
      getObjetivosService(usuarioId),
    ]);

    const meta      = objetivos.meta_ingresos_mensual ?? 5000;
    const logrado   = forecast.logrado_ingresos_mes;
    const predicted = Math.round(logrado + forecast.escenario_realista);
    const gap       = Math.max(0, meta - logrado);

    const data = {
      ...forecast,
      meta_ingresos:      meta,
      gap_ingresos:       gap,
      predicted_ingresos: predicted,
    };

    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/forecast-historico
inteligenciaRouter.get("/forecast-historico", async (_req, res) => {
  try {
    const data = await forecastHistoricoService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/estancados?dias=14
inteligenciaRouter.get("/estancados", async (req, res) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 14;
    const data = await leadsEstancadosService(dias);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/tendencias?periodo=90d
inteligenciaRouter.get("/tendencias", async (req, res) => {
  try {
    const { periodo = "todo", mes, anio } = req.query as Record<string, string>;
    const data = await tendenciasService(periodo, mes ? parseInt(mes) : undefined, anio ? parseInt(anio) : undefined);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/objetivos
inteligenciaRouter.get("/objetivos", async (req: any, res) => {
  try {
    const data = await getObjetivosService(req.usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/inteligencia/objetivos
inteligenciaRouter.put("/objetivos", async (req: any, res) => {
  try {
    const { llamadas_meta, reuniones_meta, brochures_meta, meta_ingresos_mensual } = req.body;
    await actualizarObjetivosService(req.usuario.id, {
      llamadas_meta:         Math.max(1,    parseInt(llamadas_meta)         || 10),
      reuniones_meta:        Math.max(1,    parseInt(reuniones_meta)        || 2),
      brochures_meta:        Math.max(1,    parseInt(brochures_meta)        || 5),
      meta_ingresos_mensual: Math.max(100,  parseFloat(meta_ingresos_mensual) || 5000),
    });
    const data = await getObjetivosService(req.usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/rechazos-duales
inteligenciaRouter.get("/rechazos-duales", async (_req, res) => {
  try {
    const data = await rechazosDualesService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/abandono-pipeline
inteligenciaRouter.get("/abandono-pipeline", async (_req, res) => {
  try {
    const data = await abandonoPipelineService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/primera-respuesta
inteligenciaRouter.get("/primera-respuesta", async (_req, res) => {
  try {
    const data = await tiempoPrimeraRespuestaService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/forecast/leads?tipo=calientes|activos|cierres
inteligenciaRouter.get("/forecast/leads", async (req, res) => {
  try {
    const tipo = (req.query.tipo as string) || "calientes";
    const data = await forecastLeadsService(tipo as "calientes" | "activos" | "cierres");
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener leads del forecast" });
  }
});

// GET /api/crm/inteligencia/forecast-ingresos
inteligenciaRouter.get("/forecast-ingresos", async (_req, res) => {
  try {
    const data = await forecastIngresosService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/conversion-funnel
inteligenciaRouter.get("/conversion-funnel", async (_req, res) => {
  try {
    const data = await tasaConversionFunnelService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/canal-efectividad
inteligenciaRouter.get("/canal-efectividad", async (_req, res) => {
  try {
    const data = await canalEfectividadService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/conversacion?fecha_inicio=&fecha_fin=
inteligenciaRouter.get("/conversacion", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query as Record<string, string>;
    const data = await inteligenciaConversacionService({ fecha_inicio, fecha_fin });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/leads-score?niveles=caliente,activo
inteligenciaRouter.get("/leads-score", async (req, res) => {
  try {
    const { niveles } = req.query as Record<string, string>;
    if (!niveles) return res.status(400).json({ ok: false, message: "niveles requerido" });
    const data = await leadsScoreNivelService(niveles.split(",").map(n => n.trim()));
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/leads-estado?estado=no_contesta
inteligenciaRouter.get("/leads-estado", async (req, res) => {
  try {
    const { estado } = req.query as Record<string, string>;
    if (!estado) return res.status(400).json({ ok: false, message: "estado requerido" });
    const data = await leadsPorEstadoService(estado);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/inteligencia/leads-paquete-web?paquete=Gold — Web Pro
inteligenciaRouter.get("/leads-paquete-web", async (req, res) => {
  try {
    const { paquete } = req.query as Record<string, string>;
    if (!paquete) return res.status(400).json({ ok: false, message: "paquete requerido" });
    const data = await leadsPorPaqueteWebService(paquete);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
