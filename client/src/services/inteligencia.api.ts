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
  tipo:    "positivo" | "alerta" | "info" | "oportunidad";
  titulo:  string;
  texto:   string;
  icono:   string;
  valor?:  number;
  total?:  number;
  unidad?: "pct" | "count";
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
  llamadas_semana_prom:     number;
  tendencia:                "subiendo" | "estable" | "bajando";
  tasa_conversion_pct:      number;
  leads_activos:            number;
  leads_calientes:          number;
  cierres_mes_actual:       number;
  cierres_proyectados:      number;
  ciclo_promedio_dias:      number;
  contactos_necesarios:     number;
  velocidad_comercial:      number;
  pipeline_cobertura_meses: number;
  valor_promedio_propuesta: number;
  aging_promedio_dias:      number;
  escenario_pesimista:      number;
  escenario_realista:       number;
  escenario_optimista:      number;
  logrado_ingresos_mes:     number;
  meta_ingresos:            number;
  gap_ingresos:             number;
  predicted_ingresos:       number;
}

export interface ForecastHistoricoMes {
  mes:      string;
  cerrado:  number;
  cantidad: number;
}

export async function getForecast() {
  const { data } = await api.get("/inteligencia/forecast");
  return data.data as Forecast;
}

export async function getForecastHistorico() {
  const { data } = await api.get("/inteligencia/forecast-historico");
  return data.data as ForecastHistoricoMes[];
}

export async function getForecastLeads(tipo: "calientes" | "activos" | "cierres") {
  const { data } = await api.get("/inteligencia/forecast/leads", { params: { tipo } });
  return data.data as LeadPrioridad[];
}

export interface ObjetivosDiarios {
  llamadas_meta:          number;
  reuniones_meta:         number;
  brochures_meta:         number;
  meta_ingresos_mensual:  number;
  llamadas_hoy:           number;
  reuniones_hoy:          number;
  brochures_hoy:          number;
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

export async function getObjetivos(params?: {
  periodo?: string;
  mes?:     number;
  anio?:    number;
  fecha?:   string;
}) {
  const { data } = await api.get("/inteligencia/objetivos", { params });
  return data.data as ObjetivosDiarios;
}

export async function actualizarObjetivos(metas: {
  llamadas_meta: number;
  reuniones_meta: number;
  brochures_meta: number;
  meta_ingresos_mensual?: number;
}) {
  const { data } = await api.put("/inteligencia/objetivos", metas);
  return data.data as ObjetivosDiarios;
}

// ─── Rechazos duales ─────────────────────────────────────────────────────────

export interface RechazosDuales {
  primer_contacto: {
    total_no_interesado: number;
    con_motivo:          number;
    sin_motivo:          number;
    pct_rechazo:         number;
    motivos:             { motivo: string; total: number }[];
  };
  propuestas_perdidas: {
    total:             number;
    con_motivo:        number;
    sin_motivo:        number;
    monto_perdido:     number;
    cerradas_perdidas: number;
    vencidas:          number;
    motivos:           { motivo: string; total: number }[];
  };
}

export async function getRechazosDuales() {
  const { data } = await api.get("/inteligencia/rechazos-duales");
  return data.data as RechazosDuales;
}

// ─── Análisis abandono pipeline ───────────────────────────────────────────────

export interface AbandonoPipeline {
  por_etapa:         { etapa: string; total: number }[];
  por_motivo:        { motivo: string; total: number }[];
  cruce:             { etapa: string; motivo: string; total: number }[];
  funnel_abandono:   { etapa: string; total: number }[];
  motivos_propuesta: { motivo: string; total: number }[];
}

export async function getAbandonoPipeline() {
  const { data } = await api.get("/inteligencia/abandono-pipeline");
  return data.data as AbandonoPipeline;
}

// ─── Tiempo primera respuesta ─────────────────────────────────────────────────

export interface TiempoPrimeraRespuesta {
  promedio_dias:      number | null;
  minimo_dias:        number | null;
  maximo_dias:        number | null;
  total_con_contacto: number;
  sin_contacto:       number;
  distribucion:       { label: string; valor: number; pct: number; color: string }[];
}

export async function getTiempoPrimeraRespuesta() {
  const { data } = await api.get("/inteligencia/primera-respuesta");
  return data.data as TiempoPrimeraRespuesta;
}

// ─── Forecast ingresos ponderado ─────────────────────────────────────────────

export interface ForecastIngresos {
  total_ponderado:    number;
  total_sin_ponderar: number;
  tasa_cierre_real:   number | null;
  desglose: {
    estado:      string;
    label:       string;
    cantidad:    number;
    monto_total: number;
    prob:        number;
    ponderado:   number;
  }[];
}

export async function getForecastIngresos() {
  const { data } = await api.get("/inteligencia/forecast-ingresos");
  return data.data as ForecastIngresos;
}

// ─── Tasa conversión por etapa ────────────────────────────────────────────────

export interface ConversionFunnel {
  etapas: { etapa: string; total: number; valor: number; pct_conversion: number | null }[];
  perdidos:        number;
  descartados:     number;
  tasa_global:     number;
  valor_pipeline:  number;
  valor_cerrado:   number;
  tasa_cierre:     number;
}

export async function getConversionFunnel() {
  const { data } = await api.get("/inteligencia/conversion-funnel");
  return data.data as ConversionFunnel;
}

// ─── Efectividad por canal ────────────────────────────────────────────────────

export interface CanalEfectividad {
  canal:          string;
  total:          number;
  interesados:    number;
  pct_conversion: number;
}

export async function getCanalEfectividad() {
  const { data } = await api.get("/inteligencia/canal-efectividad");
  return data.data as CanalEfectividad[];
}

// ─── Inteligencia de conversación ─────────────────────────────────────────────

export interface InteligenciaConversacion {
  acciones_acordadas:      { accion_acordada: string; total: number }[];
  duracion_por_resultado:  { resultado: string; duracion_prom: number; total: number }[];
  resultados_contestadas:  { resultado: string; total: number }[];
}

export async function getInteligenciaConversacion(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const { data } = await api.get("/inteligencia/conversacion", { params: filters });
  return data.data as InteligenciaConversacion;
}

// ─── Drill-down endpoints ─────────────────────────────────────────────────────

export interface LeadContacto {
  id:              string;
  empresa:         string;
  nombre_contacto: string | null;
  telefono:        string | null;
  ciudad:          string | null;
  etapa_pipeline:  string;
  estado_lead:     string | null;
  score?:          number;
  estado_propuesta?: string;
  monto_propuesto?:  number;
}

export async function getLeadsScoreNivel(niveles: string[]) {
  const { data } = await api.get("/inteligencia/leads-score", { params: { niveles: niveles.join(",") } });
  return data.data as LeadContacto[];
}

export async function getLeadsPorEstado(estado: string) {
  const { data } = await api.get("/inteligencia/leads-estado", { params: { estado } });
  return data.data as LeadContacto[];
}

export async function getLeadsPorPaqueteWeb(paquete: string) {
  const { data } = await api.get("/inteligencia/leads-paquete-web", { params: { paquete } });
  return data.data as LeadContacto[];
}
