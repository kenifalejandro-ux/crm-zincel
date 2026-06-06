/** src/server/routes/index.ts**/

import { Router } from "express";
import { createCrmRouter } from "./crm/index";
import { metaLeadsWebhookRouter } from "./webhooks/metaLeads";

export function createApiRouter(): Router {
  const router = Router();

  router.use("/crm", createCrmRouter());
  router.use("/webhooks/meta-leads", metaLeadsWebhookRouter);

  return router;
}