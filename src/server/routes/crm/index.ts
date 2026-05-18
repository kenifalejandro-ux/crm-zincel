/**src/server/routes/crm/index.ts */

import { Router } from "express";
import { authRouter } from "./auth";
import { prospectosRouter } from "./prospectos";
import { llamadasRouter } from "./llamadas";
import { reunionesRouter } from "./reuniones";
import { finanzasRouter } from "./finanzas";
import { brochuresRouter } from "./brochures";
import { dashboardRouter } from "./dashboard";
import { metricasRouter }       from "./metricas";
import { configuracionRouter }  from "./configuracion";
import { propuestasRouter }     from "./propuestas";
import { metaAdsRouter }           from "./metaAds";
import { tiktokAdsRouter }         from "./tiktokAds";
import { plataformaCuentasRouter } from "./plataformaCuentas";

export function createCrmRouter(): Router {
  const router = Router();

  router.use("/auth",          authRouter);
  router.use("/prospectos",    prospectosRouter);
  router.use("/llamadas",      llamadasRouter);
  router.use("/reuniones",     reunionesRouter);
  router.use("/finanzas",      finanzasRouter);
  router.use("/brochures",     brochuresRouter);
  router.use("/dashboard",     dashboardRouter);
  router.use("/metricas",      metricasRouter);
  router.use("/configuracion", configuracionRouter);
  router.use("/propuestas",    propuestasRouter);
  router.use("/meta-ads",          metaAdsRouter);
  router.use("/tiktok-ads",        tiktokAdsRouter);
  router.use("/plataforma-cuentas", plataformaCuentasRouter);

  return router;
}