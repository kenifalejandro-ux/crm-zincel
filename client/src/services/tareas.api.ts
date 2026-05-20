/**client/src/services/tareas.api.ts */

import api from "./api";
import type { Tarea, ResumenTareas } from "../types/tarea.types";

export async function getTareas(params?: { prospecto_id?: string; solo_pendientes?: boolean }) {
  const { data } = await api.get("/tareas", { params });
  return data.data as Tarea[];
}

export async function getResumenTareas() {
  const { data } = await api.get("/tareas/resumen");
  return data.data as ResumenTareas;
}

export async function crearTarea(payload: { prospecto_id?: string; titulo: string; descripcion?: string; fecha_vencimiento: string }) {
  const { data } = await api.post("/tareas", payload);
  return data.data as Tarea;
}

export async function completarTarea(id: string) {
  const { data } = await api.patch(`/tareas/${id}/completar`);
  return data.data as Tarea;
}

export async function actualizarTarea(id: string, payload: Partial<{ titulo: string; descripcion: string; fecha_vencimiento: string }>) {
  const { data } = await api.put(`/tareas/${id}`, payload);
  return data.data as Tarea;
}

export async function eliminarTarea(id: string) {
  await api.delete(`/tareas/${id}`);
}
