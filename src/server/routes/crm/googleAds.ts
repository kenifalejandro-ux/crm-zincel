/** src/server/routes/crm/googleAds.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  previewGoogleAdsInsights,
  syncGoogleAdsService,
  obtenerUrlAutorizacionGoogle,
  intercambiarCodigoGoogle,
  GoogleAdsTokenError,
} from "../../services/googleAds.service";
import { pool } from "../../config/database";

async function marcarTokenExpirado(empresa: string) {
  await pool.query(
    `UPDATE plataforma_cuentas SET activo = false,
      notas = CONCAT(COALESCE(notas,''), ' | Token expirado automáticamente ', NOW()::date)
     WHERE empresa ILIKE $1 AND plataforma = 'google'`,
    [empresa]
  );
}

export const googleAdsRouter = Router();
googleAdsRouter.use(authMiddleware);

// GET /api/crm/google-ads/auth-url?redirect_uri=X
googleAdsRouter.get("/auth-url", (req, res) => {
  const { redirect_uri } = req.query as { redirect_uri: string };
  if (!redirect_uri) return res.status(400).json({ message: "redirect_uri requerido" });
  res.json({ url: obtenerUrlAutorizacionGoogle(redirect_uri) });
});

// POST /api/crm/google-ads/oauth-callback — intercambia code por refresh_token
googleAdsRouter.post("/oauth-callback", async (req, res) => {
  const { code, redirect_uri, empresa, customer_id } = req.body;
  if (!code || !redirect_uri || !empresa || !customer_id) {
    return res.status(400).json({ message: "code, redirect_uri, empresa y customer_id son requeridos" });
  }
  try {
    const refreshToken = await intercambiarCodigoGoogle(code, redirect_uri);
    await pool.query(
      `INSERT INTO plataforma_cuentas (empresa, plataforma, account_id, access_token, activo)
       VALUES ($1, 'google', $2, $3, true)
       ON CONFLICT (empresa, plataforma) DO UPDATE
         SET account_id = EXCLUDED.account_id, access_token = EXCLUDED.access_token,
             activo = true, actualizado_en = NOW()`,
      [empresa, customer_id, refreshToken]
    );
    res.json({ ok: true, mensaje: "Cuenta Google Ads conectada correctamente" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/google-ads/preview?empresa=X&desde=Y&hasta=Z
googleAdsRouter.get("/preview", async (req, res) => {
  const { empresa, desde, hasta } = req.query as { empresa: string; desde: string; hasta: string };
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "empresa, desde y hasta son requeridos" });
  }
  try {
    const campanas = await previewGoogleAdsInsights(empresa, desde, hasta);
    res.json({ total: campanas.length, campanas });
  } catch (err: any) {
    if (err instanceof GoogleAdsTokenError) {
      await marcarTokenExpirado(empresa).catch(() => {});
      return res.status(422).json({ message: err.message, tokenExpirado: true });
    }
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/google-ads/sync
googleAdsRouter.post("/sync", async (req, res) => {
  const { empresa, desde, hasta } = req.body;
  if (!empresa || !desde || !hasta) {
    return res.status(400).json({ message: "empresa, desde y hasta son requeridos" });
  }
  try {
    const resultado = await syncGoogleAdsService(empresa, desde, hasta);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    if (err instanceof GoogleAdsTokenError) {
      await marcarTokenExpirado(empresa).catch(() => {});
      return res.status(422).json({ message: err.message, tokenExpirado: true });
    }
    res.status(500).json({ message: err.message });
  }
});
