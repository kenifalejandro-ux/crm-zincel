/** src/modules/dashboard/dashboard.routes.ts */

import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

const router = Router();

/**
 * ============================================================
 * 📊 DASHBOARD CRM PRINCIPAL
 * ============================================================
 *
 * Endpoint principal consumido por:
 *
 * DashboardPage.tsx
 *
 * Ejemplo:
 *
 * GET /dashboard?periodo=mes
 *
 * Periodos:
 *
 * - hoy
 * - semana
 * - mes
 * - anio
 *
 */

router.get(
  "/",
  DashboardController.getFullDashboard
);

/**
 * ============================================================
 * 📊 KPIs CRM
 * ============================================================
 */

router.get(
  "/kpis",
  DashboardController.getKPIs
);

/**
 * ============================================================
 * 📞 CHART - LLAMADAS POR CANAL
 * ============================================================
 */

router.get(
  "/llamadas-canal",
  DashboardController.llamadasPorCanal
);

/**
 * ============================================================
 * 📈 CHART - LLAMADAS POR MES
 * ============================================================
 */

router.get(
  "/llamadas-mes",
  DashboardController.llamadasPorMes
);

/**
 * ============================================================
 * 📅 CHART - REUNIONES POR ESTADO
 * ============================================================
 */

router.get(
  "/reuniones-estado",
  DashboardController.reunionesPorEstado
);

export default router;