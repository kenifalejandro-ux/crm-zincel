/**client/src/services/reuniones.api.ts*/

import api from "./api";
import type { CrearReunionPayload } from "../types/reunion.types";

export async function getReuniones(
  filtros?: ReunionesFiltros
) {
  const res = await api.get("/reuniones", {
    params: filtros,
  });

return res.data.data;}

export async function crearReunion(payload: {titulo: string; fecha_hora: string; modalidad: string; enlace?: string; estado?: string; notas?: string; prospecto_id: string}) {
  const { data } = await api.post("/reuniones", payload);
  return data.data;
}

export async function actualizarReunion(id: string, payload: Partial<CrearReunionPayload>) {
  const { data } = await api.put(`/reuniones/${id}`, payload);
  return data.data;
}

export async function marcarEmailEnviado(id: string) {
  const { data } = await api.patch(`/reuniones/${id}/email-enviado`);
  return data.data;
}

export async function getResumenReuniones() {
  const { data } = await api.get("/reuniones/resumen");
  return data.data;
}
interface ReunionesFiltros {
  estado?:       string;
  periodo?:      string;
  prospecto_id?: string;
}

export async function eliminarReunionesMasivoService(ids: string[]) {
  const { data } = await api.delete("/reuniones", {
    data: { ids },
  });
  return data.data;
}

