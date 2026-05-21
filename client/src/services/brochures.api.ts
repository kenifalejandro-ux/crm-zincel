/** client/src/services/brochure.api.ts */

import api from "./api";

export async function getBrochures(prospecto_id?: string) {
  const { data } = await api.get("/brochures", {
    params: prospecto_id ? { prospecto_id } : {},
  });
  return data.data;
}

export async function crearBrochure(payload: {
  prospecto_id: string;
  canal: string;
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