/** src/server/routes/index.ts**/

import { Router } from "express";
import { createCrmRouter } from "./crm/index";

export function createApiRouter(): Router {
  const router = Router();

  router.use("/crm", createCrmRouter());

  return router;
}