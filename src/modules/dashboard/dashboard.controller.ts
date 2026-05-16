/** src/modules/dashboard/dashboard.controller.ts */

import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

export const DashboardController = {

  // ============================================================
  // 📊 DASHBOARD CRM COMPLETO
  // ============================================================
  async getFullDashboard(req: Request, res: Response) {

    try {

      // ============================================================
      // 📅 FILTRO DE PERIODO
      // ============================================================

      const periodo =
        (req.query.periodo as string) || "mes";

      // ============================================================
      // 🚀 OBTENER DATA COMPLETA
      // ============================================================

      const data =
        await DashboardService.getFullDashboardData(periodo);

      // ============================================================
      // ✅ RESPONSE
      // ============================================================

      res.json(data);

    } catch (error) {

      console.error(
        "❌ Error en getFullDashboard:",
        error
      );

      res.status(500).json({

        error:
          "Error al cargar dashboard CRM"

      });
    }
  },

  // ============================================================
  // 📊 KPIs CRM
  // ============================================================
  async getKPIs(req: Request, res: Response) {

    try {

      const periodo =
        (req.query.periodo as string) || "mes";

      let whereFecha = "";

      // ============================================================
      // 📅 FILTRO DINÁMICO
      // ============================================================

      switch (periodo) {

        case "hoy":

          whereFecha = `
            DATE(created_at) = CURRENT_DATE
          `;

          break;

        case "semana":

          whereFecha = `
            created_at >= CURRENT_DATE - INTERVAL '7 days'
          `;

          break;

        case "mes":

          whereFecha = `
            DATE_TRUNC('month', created_at)
            = DATE_TRUNC('month', CURRENT_DATE)
          `;

          break;

        case "anio":

          whereFecha = `
            DATE_TRUNC('year', created_at)
            = DATE_TRUNC('year', CURRENT_DATE)
          `;

          break;

        default:

          whereFecha = "1=1";
      }

      const data =
        await DashboardService.getKPIs(whereFecha);

      res.json(data);

    } catch (error) {

      console.error(
        "❌ Error KPIs dashboard:",
        error
      );

      res.status(500).json({

        error:
          "Error KPIs dashboard CRM"

      });
    }
  },

  // ============================================================
  // 📊 CHART - LLAMADAS POR CANAL
  // ============================================================
  async llamadasPorCanal(req: Request, res: Response) {

    try {

      const periodo =
        (req.query.periodo as string) || "mes";

      let whereFecha = "";

      switch (periodo) {

        case "hoy":

          whereFecha = `
            DATE(created_at) = CURRENT_DATE
          `;

          break;

        case "semana":

          whereFecha = `
            created_at >= CURRENT_DATE - INTERVAL '7 days'
          `;

          break;

        case "mes":

          whereFecha = `
            DATE_TRUNC('month', created_at)
            = DATE_TRUNC('month', CURRENT_DATE)
          `;

          break;

        case "anio":

          whereFecha = `
            DATE_TRUNC('year', created_at)
            = DATE_TRUNC('year', CURRENT_DATE)
          `;

          break;

        default:

          whereFecha = "1=1";
      }

      const data =
        await DashboardService.llamadasPorCanal(whereFecha);

      res.json(data);

    } catch (error) {

      console.error(
        "❌ Error llamadasPorCanal:",
        error
      );

      res.status(500).json({

        error:
          "Error chart llamadas por canal"

      });
    }
  },

  // ============================================================
  // 📊 CHART - LLAMADAS POR MES
  // ============================================================
  async llamadasPorMes(req: Request, res: Response) {

    try {

      const periodo =
        (req.query.periodo as string) || "mes";

      let whereFecha = "";

      switch (periodo) {

        case "hoy":

          whereFecha = `
            DATE(created_at) = CURRENT_DATE
          `;

          break;

        case "semana":

          whereFecha = `
            created_at >= CURRENT_DATE - INTERVAL '7 days'
          `;

          break;

        case "mes":

          whereFecha = `
            DATE_TRUNC('month', created_at)
            = DATE_TRUNC('month', CURRENT_DATE)
          `;

          break;

        case "anio":

          whereFecha = `
            DATE_TRUNC('year', created_at)
            = DATE_TRUNC('year', CURRENT_DATE)
          `;

          break;

        default:

          whereFecha = "1=1";
      }

      const data =
        await DashboardService.llamadasPorMes(whereFecha);

      res.json(data);

    } catch (error) {

      console.error(
        "❌ Error llamadasPorMes:",
        error
      );

      res.status(500).json({

        error:
          "Error chart llamadas por mes"

      });
    }
  },

  // ============================================================
  // 📊 CHART - REUNIONES POR ESTADO
  // ============================================================
  async reunionesPorEstado(req: Request, res: Response) {

    try {

      const periodo =
        (req.query.periodo as string) || "mes";

      let whereFecha = "";

      switch (periodo) {

        case "hoy":

          whereFecha = `
            DATE(created_at) = CURRENT_DATE
          `;

          break;

        case "semana":

          whereFecha = `
            created_at >= CURRENT_DATE - INTERVAL '7 days'
          `;

          break;

        case "mes":

          whereFecha = `
            DATE_TRUNC('month', created_at)
            = DATE_TRUNC('month', CURRENT_DATE)
          `;

          break;

        case "anio":

          whereFecha = `
            DATE_TRUNC('year', created_at)
            = DATE_TRUNC('year', CURRENT_DATE)
          `;

          break;

        default:

          whereFecha = "1=1";
      }

      const data =
        await DashboardService.reunionesPorEstado(whereFecha);

      res.json(data);

    } catch (error) {

      console.error(
        "❌ Error reunionesPorEstado:",
        error
      );

      res.status(500).json({

        error:
          "Error chart reuniones por estado"

      });
    }
  }

};