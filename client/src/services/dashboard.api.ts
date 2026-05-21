/**client/src/services/dashboard.api.ts*/

import api from "./api";

interface DashboardFiltros {
  periodo?: string;
  mes?: number;
  anio?: number;
  fecha?: string;
}
// GET /api/crm/dashboard/metricas - Devuelve métricas para el dashboard CRM dasboard.ts

export async function getMetricasDashboard(
  filtros?: DashboardFiltros
) {
  const res = await api.get("/dashboard/metricas", { params: filtros });
  return res.data.data;
}

export type ActividadMensual = {
  mes:         number;
  label:       string;
  llamadas:    number;
  contestadas: number;
  reuniones:   number;
  realizadas:  number;
  brochures:   number;
  ventas:      number;
};

export async function getActividadAnual(anio: number): Promise<ActividadMensual[]> {
  const res = await api.get("/dashboard/actividad-anual", { params: { anio } });
  return res.data.data;
}

export type ActividadDiaria = {
  dia:         number;
  label:       string;
  llamadas:    number;
  contestadas: number;
  reuniones:   number;
  realizadas:  number;
  brochures:   number;
};

export async function getActividadMensual(anio: number, mes: number): Promise<ActividadDiaria[]> {
  const res = await api.get("/dashboard/actividad-mensual", { params: { anio, mes } });
  return res.data.data;
}