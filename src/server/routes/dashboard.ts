/** src/server/routes/dashboard.ts */

import { Router } from "express";
import { metricasDashboardService } from "../services/dashboard.service";

export function createDashboardRouter() {
  const router = Router();

  router.get("/dashboard", async (_req, res) => {
    try {
      const data = await metricasDashboardService();
      res.json({ ok: true, data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener métricas del dashboard CRM" });
    }
  });

  return router;
}