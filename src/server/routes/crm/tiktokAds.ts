/** src/server/routes/crm/tiktokAds.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  previewTikTokInsights,
  syncTikTokAdsService,
  renovarTokenTikTok,
  obtenerUrlAutorizacionTikTok,
  TikTokTokenError,
} from "../../services/tiktokAds.service";
import { pool } from "../../config/database";

async function marcarTokenExpirado(empresa: string) {
  await pool.query(
    `UPDATE plataforma_cuentas SET activo = false, notas = CONCAT(COALESCE(notas,''), ' | Token expirado automáticamente ', NOW()::date)
     WHERE empresa ILIKE $1 AND plataforma = 'tiktok'`,
    [empresa]
  );
}

export const tiktokAdsRouter = Router();
tiktokAdsRouter.use(authMiddleware);

// GET /api/crm/tiktok-ads/auth-url
tiktokAdsRouter.get("/auth-url", (_req, res) => {
  res.json({ url: obtenerUrlAutorizacionTikTok() });
});

// POST /api/crm/tiktok-ads/renew
tiktokAdsRouter.post("/renew", async (req, res) => {
  const { empresa, auth_code } = req.body;
  if (!empresa || !auth_code) {
    return res.status(400).json({ message: "Campos 'empresa' y 'auth_code' requeridos" });
  }
  try {
    const nuevoToken = await renovarTokenTikTok(empresa, auth_code);
    res.json({ ok: true, mensaje: "Token renovado correctamente", token_preview: nuevoToken.slice(0, 8) + "..." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

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
    if (err instanceof TikTokTokenError) {
      await marcarTokenExpirado(empresa).catch(() => {});
      return res.status(422).json({ message: err.message, tokenExpirado: true });
    }
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
    if (err instanceof TikTokTokenError) {
      await marcarTokenExpirado(empresa).catch(() => {});
      return res.status(422).json({ message: err.message, tokenExpirado: true });
    }
    res.status(500).json({ message: err.message });
  }
});
