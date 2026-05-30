/** client/src/services/inicio.api.ts */

import api from "./api";

export interface TareaResumen {
  id:                 string;
  titulo:             string;
  fecha_vencimiento:  string;
}

export interface ReunionHoy {
  id:         string;
  titulo:     string;
  fecha_hora: string;
  empresa:    string;
}

export interface LeadCaliente {
  id:              string;
  empresa:         string;
  nombre_contacto: string | null;
  telefono:        string | null;
  etapa_pipeline:  string;
  ciudad:          string | null;
  valor_pipeline:  number;
}

export interface ResumenInicio {
  tareas: {
    pendientes_hoy: number;
    vencidas:       number;
    proximas:       TareaResumen[];
  };
  reuniones_hoy:  ReunionHoy[];
  alertas: {
    estancados: number;
    criticos:   number;
    urgentes:   number;
  };
  leads_calientes: LeadCaliente[];
}

export async function getResumenInicio(): Promise<ResumenInicio> {
  const { data } = await api.get("/inicio");
  return data.data as ResumenInicio;
}
