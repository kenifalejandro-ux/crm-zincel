/** src/server/routes/webhooks/metaLeads.ts */

import { Router } from "express";
import { env } from "../../config/env";
import { procesarMetaLead } from "../../services/metaLeadAds.service";

export const metaLeadsWebhookRouter = Router();

// GET — Meta verifica que el endpoint existe al registrar el webhook
metaLeadsWebhookRouter.get("/", (req, res) => {
  const mode      = req.query["hub.mode"] as string;
  const token     = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === env.metaWebhookVerifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Verificación fallida" });
});

// POST — Meta envía notificación cuando llega un nuevo lead
metaLeadsWebhookRouter.post("/", (req, res) => {
  // Responder inmediatamente — Meta requiere respuesta en < 20s
  res.status(200).send("EVENT_RECEIVED");

  const body = req.body as any;
  if (body?.object !== "page") return;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const { leadgen_id, page_id, ad_name, campaign_name, form_id } = change.value ?? {};
      if (!leadgen_id || !page_id) continue;

      procesarMetaLead(leadgen_id, page_id, { ad_name, campaign_name, form_id })
        .catch((err) => console.error("[MetaLeadWebhook] Error procesando lead:", err));
    }
  }
});
