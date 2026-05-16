/**client/src/services/prospectos.api.ts*/

import api from "./api";
import type { FiltrosProspecto, Prospecto } from "../types/prospecto.types";

export async function getProspectos(filtros?: any) {

  const params = {
    busqueda: filtros?.busqueda || "",
    estado_lead: filtros?.estado_lead || "",
    pagina: filtros?.pagina || 1,
    limite: filtros?.limite || 50,
  };

  const { data } = await api.get("/prospectos", {
    params,
  });

  return data;
}

export async function getProspecto(id: string) {
  const { data } = await api.get(`/prospectos/${id}`);
  return data.data as Prospecto;
}

export async function crearProspecto(payload: Partial<Prospecto>) {
  const { data } = await api.post("/prospectos", payload);
  return data.data as Prospecto;
}

export async function actualizarProspecto(id: string, payload: Partial<Prospecto>) {
  const { data } = await api.put(`/prospectos/${id}`, payload);
  return data.data as Prospecto;
}

export async function eliminarProspecto(id: string) {
  const { data } = await api.delete(`/prospectos/${id}`);
  return data;
}


// 🚀 IMPORTAR
export async function importarProspectos(prospectos: any[]) {
  const res = await api.post("/crm/prospectos/importar", {
    prospectos,
  });
  return res.data;
}
