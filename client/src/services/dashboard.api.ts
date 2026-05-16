/**client/src/services/dashboard.api.ts*/

import api from "./api";

interface DashboardFiltros {
  periodo?: string;
  mes?: number;
  anio?: number;
}
// GET /api/crm/dashboard/metricas - Devuelve métricas para el dashboard CRM dasboard.ts

export async function getMetricasDashboard(
  filtros?: DashboardFiltros
) {
  const res = await api.get("/dashboard/metricas", {
    params: filtros,
  });

return res.data.data;
}