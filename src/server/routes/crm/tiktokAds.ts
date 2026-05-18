/** src/server/routes/crm/tiktokAds.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { previewTikTokInsights, syncTikTokAdsService } from "../../services/tiktokAds.service";

export const tiktokAdsRouter = Router();
tiktokAdsRouter.use(authMiddleware);

// GET /api/crm/tiktok-ads/preview?empresa=X&desde=Y&hasta=Z
tiktokAdsRouter.get("/preview", async (req, res) => {
  const { empresa, desde, hasta } = req.query as { empresa: string; desde: string; hasta: string };
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "Parámetros 'empresa', 'desde' y 'hasta' requeridos" });
  }
  try {
    const campanas = await previewTikTokInsights(empresa, desde, hasta);
    res.json({ total: campanas.length, campanas });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/tiktok-ads/sync
tiktokAdsRouter.post("/sync", async (req, res) => {
  const { empresa, desde, hasta } = req.body;
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "Campos 'empresa', 'desde' y 'hasta' requeridos" });
  }
  try {
    const resultado = await syncTikTokAdsService(empresa, desde, hasta);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
