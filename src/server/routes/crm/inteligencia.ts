/** src/server/routes/crm/inteligencia.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  actividadKPIsService,
  insightsAutomaticosService,
  leadsEstancadosService,
  prioridadOperacionalService,
  forecastingService,
  getObjetivosService,
  actualizarObjetivosService,
  tendenciasService,
  leadesPrioridadService,
  abandonoPipelineService,
  rechazosDualesService,
  tiempoPrimeraRespuestaService,
  forecastIngresosService,
  tasaConversionFunnelService,
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
    const data = await forecastingService();
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
    const { llamadas_meta, reuniones_meta, brochures_meta } = req.body;
    await actualizarObjetivosService(req.usuario.id, {
      llamadas_meta:  Math.max(1, parseInt(llamadas_meta)  || 10),
      reuniones_meta: Math.max(1, parseInt(reuniones_meta) || 2),
      brochures_meta: Math.max(1, parseInt(brochures_meta) || 5),
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
