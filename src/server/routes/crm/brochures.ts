/** src/server/routes/crm/brochures.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  crearBrochureService,
  obtenerBrochuresService,
  resumenBrochuresService,
  actualizarBrochureService,
  eliminarBrochuresMasivoService,
  estadisticasBrochuresPorPeriodoService,
  resumenBrochuresFiltradoService,
} from "../../services/brochure.service";
import { invalidarCacheCRM } from "../../config/cache";

export const brochuresRouter = Router();

brochuresRouter.use(authMiddleware);

// GET /api/crm/brochures/estadisticas
brochuresRouter.get("/estadisticas", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, granularidad } = req.query;
    const data = await estadisticasBrochuresPorPeriodoService(
      fecha_inicio as string | undefined,
      fecha_fin    as string | undefined,
      ((granularidad as string) === "hora" ? "hora" : (granularidad as string) === "mes" ? "mes" : "dia")
    );
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/brochures/resumen-filtrado
brochuresRouter.get("/resumen-filtrado", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const data = await resumenBrochuresFiltradoService({
      fecha_inicio: fecha_inicio as string | undefined,
      fecha_fin:    fecha_fin    as string | undefined,
    });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/brochures/resumen
brochuresRouter.get("/resumen", async (_req, res) => {
  try {
    const data = await resumenBrochuresService();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/brochures
brochuresRouter.get("/", async (req, res) => {
  try {
    const data = await obtenerBrochuresService({
      prospecto_id: req.query.prospecto_id as string | undefined,
      fecha_inicio: req.query.fecha_inicio as string | undefined,
      fecha_fin:    req.query.fecha_fin    as string | undefined,
    });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/brochures
brochuresRouter.post("/", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { prospecto_id, canal, notas, fecha_envio } = req.body;
    if (!prospecto_id || !canal) {
      return res.status(400).json({ ok: false, message: "prospecto_id y canal son obligatorios" });
    }
    const data = await crearBrochureService({ prospecto_id, canal, notas, fecha_envio }, usuario.id);
    void invalidarCacheCRM();
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/brochures/:id
brochuresRouter.put("/:id", async (req, res) => {
  try {
    const { canal, notas, fecha_envio } = req.body;
    const data = await actualizarBrochureService(req.params.id, { canal, notas, fecha_envio });
    if (!data) return res.status(404).json({ ok: false, message: "Brochure no encontrado" });
    void invalidarCacheCRM();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/brochures/masivo
brochuresRouter.delete("/masivo", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ ok: false, message: "IDs inválidos" });
    }

    const eliminados = await eliminarBrochuresMasivoService(ids);
    res.status(200).json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});