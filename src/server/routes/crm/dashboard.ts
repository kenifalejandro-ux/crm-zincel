/**src/server/routes/crm/dashboard.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { metricasDashboardService, actividadAnualService, actividadMensualService } from "../../services/dashboard.service";

export const dashboardRouter = Router();

// Solo usar authMiddleware en producción
if (process.env.NODE_ENV === 'production') {
  dashboardRouter.use(authMiddleware);
}

// GET /api/crm/dashboard/actividad-anual?anio=2026
dashboardRouter.get("/actividad-anual", async (req, res) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();
    const data = await actividadAnualService(anio);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/dashboard/actividad-mensual?anio=2026&mes=5
dashboardRouter.get("/actividad-mensual", async (req, res) => {
  try {
    const now  = new Date();
    const anio = req.query.anio ? Number(req.query.anio) : now.getFullYear();
    const mes  = req.query.mes  ? Number(req.query.mes)  : now.getMonth() + 1;
    const data = await actividadMensualService(anio, mes);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/dashboard/metricas - Devuelve métricas para el dashboard CRM dasboard.api.ts
dashboardRouter.get("/metricas", async (req, res) => {
  try {
    const periodo = (req.query.periodo as string) || "mes";
    const mes   = req.query.mes   ? Number(req.query.mes)  : undefined;
    const anio  = req.query.anio  ? Number(req.query.anio) : undefined;
    const fecha = req.query.fecha as string | undefined;
    const data = await metricasDashboardService(periodo, mes, anio, fecha);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});