/**src/server/routes/crm/llamadas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearLlamadaSchema } from "../../schemas/llamada.schema";
import {
  crearLlamadaService,
  obtenerLlamadasService,
  resumenLlamadasService,
  obtenerTodasLlamadasService,
  estadisticasLlamadasPorPeriodoService,
  actualizarLlamadaService,
} from "../../services/llamada.service";

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

// GET /api/crm/llamadas/estadisticas/:periodo
llamadasRouter.get("/estadisticas/:periodo", async (req, res) => {
  try {
    const { periodo } = req.params;
    if (!["dia", "mes", "semana"].includes(periodo)) {
      return res.status(400).json({ ok: false, message: "Período inválido. Use: dia, mes, semana" });
    }
    const data = await estadisticasLlamadasPorPeriodoService(periodo as "dia" | "mes" | "semana");
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
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/llamadas
llamadasRouter.post("/", validate(crearLlamadaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearLlamadaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});