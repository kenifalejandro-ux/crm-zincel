/**src/server/routes/crm/llamadas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearLlamadaSchema } from "../../schemas/llamada.schema";
import { eventBus, CRM_EVENTS } from "../../shared/events/eventBus";
import {
  crearLlamadaService,
  obtenerLlamadasService,
  resumenLlamadasService,
  obtenerTodasLlamadasService,
  estadisticasLlamadasPorPeriodoService,
  actualizarLlamadaService,
  heatmapLlamadasService,
  eliminarLlamadaService,
  eliminarLlamadasMasivoService,
} from "../../services/llamada.service";
import { invalidarCacheCRM } from "../../config/cache";

export const llamadasRouter = Router();

llamadasRouter.use(authMiddleware);

// GET /api/crm/llamadas
llamadasRouter.get("/", async (req, res) => {
  try {
    const fecha_inicio = req.query.fecha_inicio as string | undefined;
    const fecha_fin = req.query.fecha_fin as string | undefined;
    const data = await obtenerTodasLlamadasService({ fecha_inicio, fecha_fin });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/llamadas/resumen
llamadasRouter.get("/resumen", async (req, res) => {
  try {
    const fecha_inicio = req.query.fecha_inicio as string | undefined;
    const fecha_fin = req.query.fecha_fin as string | undefined;
    const data = await resumenLlamadasService({ fecha_inicio, fecha_fin });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/llamadas/heatmap
llamadasRouter.get("/heatmap", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query as Record<string, string>;
    const data = await heatmapLlamadasService({ fecha_inicio, fecha_fin });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/llamadas/estadisticas/:periodo
llamadasRouter.get("/estadisticas/:periodo", async (req, res) => {
  try {
    const { periodo } = req.params;
    if (!["dia", "mes", "semana", "anio"].includes(periodo)) {
      return res.status(400).json({ ok: false, message: "Período inválido. Use: dia, mes, semana, anio" });
    }
    const { fecha_inicio, fecha_fin } = req.query as Record<string, string>;
    const granularidad = periodo === "dia" ? "hora" : periodo === "anio" ? "mes" : "dia";
    const data = await estadisticasLlamadasPorPeriodoService(fecha_inicio, fecha_fin, granularidad as "dia" | "hora" | "mes");
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/llamadas/:prospecto_id
llamadasRouter.get("/:prospecto_id", async (req, res) => {
  try {
    const data = await obtenerLlamadasService(req.params.prospecto_id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/llamadas/:id
llamadasRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarLlamadaService(req.params.id, req.body);
    if (!data) return res.status(404).json({ ok: false, message: "No encontrada" });
    void invalidarCacheCRM();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/llamadas/masivo
llamadasRouter.delete("/masivo", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ ok: false, message: "IDs inválidos" });
    const eliminados = await eliminarLlamadasMasivoService(ids);
    void invalidarCacheCRM();
    res.json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/llamadas/:id
llamadasRouter.delete("/:id", async (req, res) => {
  try {
    const ok = await eliminarLlamadaService(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, message: "Llamada no encontrada" });
    void invalidarCacheCRM();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/llamadas
llamadasRouter.post("/", validate(crearLlamadaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearLlamadaService(req.body, usuario.id);
    void invalidarCacheCRM();
    eventBus.publish(CRM_EVENTS.LLAMADA_REGISTRADA, { prospecto_id: data.prospecto_id });
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});