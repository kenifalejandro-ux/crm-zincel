/** src/server/routes/crm/metaOAuth.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  obtenerUrlAutorizacionMeta,
  intercambiarCodigoMeta,
  estadoMetaOAuth,
} from "../../services/metaOAuth.service";

export const metaOAuthRouter = Router();

// ── Callback de Meta OAuth — SIN authMiddleware ───────────────────────────────
metaOAuthRouter.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(
      `${env.appBaseUrl}/configuracion?meta_error=${encodeURIComponent(error_description ?? error)}`
    );
  }
  if (!code || !state) {
    return res.redirect("${env.appBaseUrl}/configuracion?meta_error=Parámetros+inválidos");
  }

  const decoded = decodeURIComponent(state);
  const [empresa, from = "configuracion"] = decoded.split("|||");
  const successBase = from === "organico"
    ? "${env.appBaseUrl}/metricas"
    : "${env.appBaseUrl}/configuracion";
  const errorBase = from === "organico"
    ? "${env.appBaseUrl}/metricas"
    : "${env.appBaseUrl}/configuracion";

  try {
    await intercambiarCodigoMeta(code, empresa);
    res.redirect(
      `${successBase}?meta_conectado=1&empresa=${encodeURIComponent(empresa)}`
    );
  } catch (err: any) {
    res.redirect(
      `${errorBase}?meta_error=${encodeURIComponent(err.message)}`
    );
  }
});

metaOAuthRouter.use(authMiddleware);

// GET /api/crm/meta-oauth/auth-url?empresa=X&from=organico
metaOAuthRouter.get("/auth-url", (req, res) => {
  const { empresa, from } = req.query as { empresa: string; from?: string };
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const url = obtenerUrlAutorizacionMeta(empresa, from ?? "configuracion");
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/meta-oauth/estado?empresa=X
metaOAuthRouter.get("/estado", async (req, res) => {
  const { empresa } = req.query as { empresa: string };
  if (!empresa) return res.json({ conectado: false });
  try {
    const estado = await estadoMetaOAuth(empresa);
    res.json(estado);
  } catch {
    res.json({ conectado: false });
  }
});
