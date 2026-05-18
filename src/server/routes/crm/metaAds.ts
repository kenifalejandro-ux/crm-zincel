/** src/server/routes/crm/metaAds.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { previewMetaInsights, syncMetaAdsService } from "../../services/metaAds.service";

export const metaAdsRouter = Router();

metaAdsRouter.use(authMiddleware);

// GET /api/crm/meta-ads/empresa — nombre de empresa configurada
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
metaAdsRouter.post("/sync", async (req, res) => {
  const { empresa, desde, hasta } = req.body;
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "Campos 'empresa', 'desde' y 'hasta' requeridos" });
  }
  try {
    const resultado = await syncMetaAdsService(empresa, desde, hasta);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
