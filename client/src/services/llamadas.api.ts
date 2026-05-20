/**client/src/services/llamadas.api.ts*/

import api from "./api";
import type { CrearLlamadaPayload } from "../types/llamada.types";

export async function getLlamadas(prospecto_id: string) {
  const { data } = await api.get(`/llamadas/${prospecto_id}`);
  return data.data;
}

export async function crearLlamada(payload: CrearLlamadaPayload) {
  const { data } = await api.post("/llamadas", payload);
  return data.data;
}

export async function getResumenLlamadas(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/llamadas/resumen", { params: filters });
  return data.data;
}

export async function getAllLlamadas(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/llamadas", { params: filters });
  return data.data;
}

export async function getEstadisticasLlamadas(
  periodo: "dia" | "mes" | "semana",
  filters?: { fecha_inicio?: string; fecha_fin?: string }
) {
  const { data } = await api.get(`/llamadas/estadisticas/${periodo}`, { params: filters });
  return data.data;
}

export async function actualizarLlamada(id: string, payload: Partial<CrearLlamadaPayload>) {
  const { data } = await api.put(`/llamadas/${id}`, payload);
  return data.data;
}

export async function getHeatmapLlamadas(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/llamadas/heatmap", { params: filters });
  return data.data as Array<{ hora: number; total: number; contestadas: number; tasa: number }>;
}
