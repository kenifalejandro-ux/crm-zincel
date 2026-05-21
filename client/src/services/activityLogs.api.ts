/** client/src/services/activityLogs.api.ts */

import api from "./api";

export type TipoActividad =
  | "llamada" | "reunion" | "propuesta" | "brochure"
  | "tarea"   | "pipeline" | "score"    | "automatizacion" | "nota";

export interface ActivityLog {
  id:          string;
  tipo:        TipoActividad;
  titulo:      string;
  descripcion: string | null;
  metadata:    Record<string, unknown>;
  usuario_id:  string | null;
  creado_en:   string;
}

export async function getTimeline(prospectoId: string): Promise<ActivityLog[]> {
  const { data } = await api.get(`/activity-logs/${prospectoId}`);
  return data.data as ActivityLog[];
}
