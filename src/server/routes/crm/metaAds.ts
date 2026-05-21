/** src/server/routes/crm/metaAds.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { previewMetaInsights, syncMetaAdsService } from "../../services/metaAds.service";
import { getMetaAdsQueue } from "../../config/queue";

export const metaAdsRouter = Router();

metaAdsRouter.use(authMiddleware);

// GET /api/crm/meta-ads/empresa
metaAdsRouter.get("/empresa", (_req, res) => {
  const { env } = require("../../config/env");
  res.json({ empresa: env.metaEmpresaNombre || null });
});

// GET /api/crm/meta-ads/preview?empresa=X&desde=2025-01-01&hasta=2025-01-31
metaAdsRouter.get("/preview", async (req, res) => {
  const { empresa, desde, hasta } = req.query as { empresa: string; desde: string; hasta: string };
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "Parámetros 'empresa', 'desde' y 'hasta' requeridos" });
  }
  try {
    const campanas = await previewMetaInsights(empresa, desde, hasta);
    res.json({ total: campanas.length, campanas });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/meta-ads/sync
// Con Redis: encola el job y responde inmediatamente con jobId
// Sin Redis: ejecuta síncronamente (fallback)
metaAdsRouter.post("/sync", async (req, res) => {
  const { empresa, desde, hasta } = req.body;
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "Campos 'empresa', 'desde' y 'hasta' requeridos" });
  }

  const queue = getMetaAdsQueue();

  if (queue) {
    try {
      const job = await queue.add("sync", { empresa, desde, hasta });
      return res.json({ ok: true, async: true, jobId: job.id, mensaje: "Sincronización iniciada en background" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Fallback sin Redis: ejecución síncrona
  try {
    const resultado = await syncMetaAdsService(empresa, desde, hasta);
    res.json({ ok: true, async: false, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/meta-ads/sync/:jobId — estado de un job en background
metaAdsRouter.get("/sync/:jobId", async (req, res) => {
  const queue = getMetaAdsQueue();
  if (!queue) {
    return res.status(404).json({ message: "Jobs no disponibles — Redis no configurado" });
  }
  try {
    const job = await queue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job no encontrado" });

    const state    = await job.getState();
    const progress = job.progress;
    const result   = job.returnvalue;
    const failReason = job.failedReason;

    res.json({ ok: true, jobId: job.id, state, progress, result: result ?? null, error: failReason ?? null });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
