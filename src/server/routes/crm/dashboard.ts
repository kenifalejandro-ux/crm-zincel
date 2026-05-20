/**src/server/routes/crm/dashboard.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { metricasDashboardService } from "../../services/dashboard.service";

export const dashboardRouter = Router();

// Solo usar authMiddleware en producción
if (process.env.NODE_ENV === 'production') {
  dashboardRouter.use(authMiddleware);
}

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