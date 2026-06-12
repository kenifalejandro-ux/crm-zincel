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
import { metaCuentasRouter }       from "./metaCuentas";
import { tiktokAdsRouter }         from "./tiktokAds";
import { plataformaCuentasRouter } from "./plataformaCuentas";
import { tareasRouter }            from "./tareas";
import { plantillasRouter }        from "./plantillas";
import { inteligenciaRouter }      from "./inteligencia";
import { activityLogsRouter }      from "./activityLogs";
import { notificacionesRouter }    from "./notificaciones";
import { inicioRouter }            from "./inicio";
import { okrRouter }               from "./okr";
import { jornadaRouter }           from "./jornada";
import { resultadosRouter }        from "./resultados";
import { benchmarksRouter }          from "./benchmarks";
import { analisisEmpresasRouter }    from "./analisisEmpresas";
import { googleAdsRouter }           from "./googleAds";
import { instagramOrganicoRouter }   from "./instagramOrganico";
import { competidoresRouter }        from "./competidores";
import { whatsappRouter }            from "./whatsapp";
import { metaOAuthRouter }           from "./metaOAuth";

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
  router.use("/meta-cuentas",      metaCuentasRouter);
  router.use("/tiktok-ads",        tiktokAdsRouter);
  router.use("/plataforma-cuentas", plataformaCuentasRouter);
  router.use("/tareas",            tareasRouter);
  router.use("/plantillas",        plantillasRouter);
  router.use("/inteligencia",      inteligenciaRouter);
  router.use("/activity-logs",     activityLogsRouter);
  router.use("/notificaciones",    notificacionesRouter);
  router.use("/inicio",            inicioRouter);
  router.use("/okr",               okrRouter);
  router.use("/jornada",           jornadaRouter);
  router.use("/resultados",        resultadosRouter);
  router.use("/benchmarks",            benchmarksRouter);
  router.use("/empresas-analisis",     analisisEmpresasRouter);
  router.use("/google-ads",            googleAdsRouter);
  router.use("/organico",              instagramOrganicoRouter);
  router.use("/competidores",          competidoresRouter);
  router.use("/whatsapp",              whatsappRouter);
  router.use("/meta-oauth",            metaOAuthRouter);

  return router;
}