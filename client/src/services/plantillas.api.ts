/**client/src/services/plantillas.api.ts */

import api from "./api";
import type { Plantilla } from "../types/plantilla.types";

export async function getPlantillas() {
  const { data } = await api.get("/plantillas");
  return data.data as Plantilla[];
}

export async function crearPlantilla(payload: { titulo: string; canal: string; contenido: string }) {
  const { data } = await api.post("/plantillas", payload);
  return data.data as Plantilla;
}

export async function actualizarPlantilla(id: string, payload: Partial<{ titulo: string; canal: string; contenido: string }>) {
  const { data } = await api.put(`/plantillas/${id}`, payload);
  return data.data as Plantilla;
}

export async function eliminarPlantilla(id: string) {
  await api.delete(`/plantillas/${id}`);
}

export function personalizarPlantilla(contenido: string, vars: { empresa?: string; nombre?: string; telefono?: string }) {
  return contenido
    .replace(/\{\{empresa\}\}/g,  vars.empresa  ?? "")
    .replace(/\{\{nombre\}\}/g,   vars.nombre   ?? "")
    .replace(/\{\{telefono\}\}/g, vars.telefono ?? "");
}
