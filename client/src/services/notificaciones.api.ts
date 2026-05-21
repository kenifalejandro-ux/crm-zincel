/** client/src/services/notificaciones.api.ts */

import api from "./api";

export interface Notificacion {
  id:        string;
  tipo:      string;
  titulo:    string;
  cuerpo:    string | null;
  url:       string | null;
  leida:     boolean;
  creado_en: string;
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const { data } = await api.get("/notificaciones");
  return data;
}

export async function getConteoNoLeidas(): Promise<number> {
  const { data } = await api.get("/notificaciones/count");
  return data.total;
}

export async function marcarLeida(id: string): Promise<void> {
  await api.put(`/notificaciones/${id}/leer`);
}

export async function marcarTodasLeidas(): Promise<void> {
  await api.put("/notificaciones/leer-todo");
}
