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
} from "../../services/metricas.service";

export const metricasRouter = Router();

metricasRouter.use(authMiddleware);

metricasRouter.get("/", async (req, res) => {
  try {
    const { empresa, plataforma, sub_plataforma } = req.query as Record<string, string>;
    const data = await listarMetricasService({ empresa, plataforma, sub_plataforma });
    res.status(200).json({ ok: true, data });
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
