/** client/src/services/inteligencia.api.ts */

import api from "./api";

export interface ActividadKPIs {
  llamadas: {
    total: number; contestadas: number; no_contestadas: number;
    duracion_prom: number; duracion_total: number; tasa_contacto: number;
  };
  reuniones: {
    total: number; realizadas: number; canceladas: number;
    postergadas: number; programadas: number;
  };
  propuestas: {
    total: number; enviadas: number; aceptadas: number;
    rechazadas: number; caidas: number; monto_cerrado: number;
  };
  brochures: { total: number; enviados: number };
}

export interface Insight {
  tipo:   "positivo" | "alerta" | "info" | "oportunidad";
  titulo: string;
  texto:  string;
  icono:  string;
}

export interface LeadEstancado {
  id: string; empresa: string; nombre_contacto: string; telefono: string;
  etapa_pipeline: string; prioridad: string;
  ultima_actividad: string | null; ultima_llamada: string | null;
}

export async function getActividadKPIs(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/inteligencia/actividad", { params: filters });
  return data.data as ActividadKPIs;
}

export async function getInsights() {
  const { data } = await api.get("/inteligencia/insights");
  return data.data as Insight[];
}

export async function getLeadsEstancados(dias = 14) {
  const { data } = await api.get("/inteligencia/estancados", { params: { dias } });
  return data.data as LeadEstancado[];
}

export interface AccionPrioridad {
  nivel:       "critica" | "urgente" | "pendiente";
  icono:       string;
  titulo:      string;
  descripcion: string;
  cantidad:    number;
  accion:      string;
  tipo:        string;
}

export interface LeadPrioridad {
  id:              string;
  empresa:         string;
  nombre_contacto: string;
  telefono:        string;
  etapa_pipeline:  string;
  estado_lead:     string;
  ciudad:          string | null;
  actualizado_en:  string;
}

export async function getPrioridadOperacional() {
  const { data } = await api.get("/inteligencia/prioridad");
  return data.data as AccionPrioridad[];
}

export async function getLeadsPrioridad(tipo: string) {
  const { data } = await api.get("/inteligencia/prioridad-leads", { params: { tipo } });
  return data.data as LeadPrioridad[];
}

export interface Forecast {
  llamadas_semana_prom:  number;
  tendencia:             "subiendo" | "estable" | "bajando";
  tasa_conversion_pct:   number;
  leads_activos:         number;
  leads_calientes:       number;
  cierres_mes_actual:    number;
  cierres_proyectados:   number;
  ciclo_promedio_dias:   number;
  contactos_necesarios:  number;
}

export async function getForecast() {
  const { data } = await api.get("/inteligencia/forecast");
  return data.data as Forecast;
}

export interface ObjetivosDiarios {
  llamadas_meta:  number;
  reuniones_meta: number;
  brochures_meta: number;
  llamadas_hoy:   number;
  reuniones_hoy:  number;
  brochures_hoy:  number;
}

export interface Tendencias {
  llamadas:  { actual: number; anterior: number; pct: number | null };
  reuniones: { actual: number; anterior: number; pct: number | null };
  brochures: { actual: number; anterior: number; pct: number | null };
}

export async function getTendencias(periodo: string, mes?: number, anio?: number) {
  const { data } = await api.get("/inteligencia/tendencias", { params: { periodo, mes, anio } });
  return data.data as Tendencias;
}

export async function getObjetivos() {
  const { data } = await api.get("/inteligencia/objetivos");
  return data.data as ObjetivosDiarios;
}

export async function actualizarObjetivos(metas: {
  llamadas_meta: number;
  reuniones_meta: number;
  brochures_meta: number;
}) {
  const { data } = await api.put("/inteligencia/objetivos", metas);
  return data.data as ObjetivosDiarios;
}
