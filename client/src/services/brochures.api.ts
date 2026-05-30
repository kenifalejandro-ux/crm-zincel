/** client/src/services/brochure.api.ts */

import api from "./api";

export async function getBrochures(filters?: { prospecto_id?: string; fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/brochures", { params: filters ?? {} });
  return data.data;
}

export async function crearBrochure(payload: {
  prospecto_id: string;
  canal: string;
  fecha_envio?: string;
  notas?: string;
}) {
  const { data } = await api.post("/brochures", payload);
  return data.data;
}

export async function getResumenBrochures() {
  const { data } = await api.get("/brochures/resumen");
  return data.data;
}

export async function eliminarBrochure(id: string) {
  const { data } = await api.delete(`/brochures/${id}`);
  return data;
}

export async function actualizarBrochure(id: string, payload: { canal?: string; fecha_envio?: string; notas?: string }) {
  const { data } = await api.put(`/brochures/${id}`, payload);
  return data.data;
}

export async function eliminarBrochuresMasivo(ids: string[]) {
  const { data } = await api.delete("/brochures/masivo", { data: { ids } });
  return data;
}

export async function getEstadisticasBrochures(
  granularidad: "dia" | "hora" | "mes",
  filters?: { fecha_inicio?: string; fecha_fin?: string }
) {
  const { data } = await api.get("/brochures/estadisticas", {
    params: { granularidad, ...filters },
  });
  return data.data as Array<{ periodo: any; total: number }>;
}

export async function getResumenBrochuresFiltrado(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/brochures/resumen-filtrado", { params: filters });
  return data.data as {
    total: number;
    canales: Array<{ canal: string; total: number }>;
  };
}