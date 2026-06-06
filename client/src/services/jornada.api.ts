/**client/src/services/jornada.api.ts */

import api from "./api";
import type { RegistroJornada, ResumenJornada, RegistroSemanal, ActividadJornada, ServicioJornada } from "../types/jornada.types";

export async function getRegistrosJornada(params?: {
  fecha?:        string;
  semana?:       string;
  prospecto_id?: string;
  categoria?:    string;
  servicio?:     string;
}) {
  const { data } = await api.get("/jornada", { params });
  return data.data as RegistroJornada[];
}

export async function getResumenJornada() {
  const { data } = await api.get("/jornada/resumen");
  return data.data as ResumenJornada;
}

export async function getResumenSemanal() {
  const { data } = await api.get("/jornada/semanal");
  return data.data as RegistroSemanal[];
}

export async function crearRegistroJornada(payload: {
  fecha:         string;
  servicio:      ServicioJornada;
  categoria:     ActividadJornada;
  descripcion?:  string;
  horas:         number;
  prospecto_id?: string | null;
}) {
  const { data } = await api.post("/jornada", payload);
  return data.data as RegistroJornada;
}

export async function actualizarRegistroJornada(id: string, payload: Partial<{
  fecha:         string;
  servicio:      ServicioJornada;
  categoria:     ActividadJornada;
  descripcion:   string;
  horas:         number;
  prospecto_id:  string | null;
}>) {
  const { data } = await api.put(`/jornada/${id}`, payload);
  return data.data as RegistroJornada;
}

export async function eliminarRegistroJornada(id: string) {
  await api.delete(`/jornada/${id}`);
}
