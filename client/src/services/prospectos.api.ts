/**client/src/services/prospectos.api.ts*/

import api from "./api";
import type { FiltrosProspecto, Prospecto } from "../types/prospecto.types";

export interface ResumenProspectos {
  // Lead states
  total:                   number;
  nuevo:                   number;
  por_gestionar:           number;
  interesado:              number;
  no_contesta:             number;
  volver_a_llamar:         number;
  no_interesado:           number;
  ya_tiene_proveedor:      number;
  solicita_informacion:    number;
  buzon_de_voz:            number;
  fuera_de_servicio:       number;
  numero_equivocado:       number;
  baja_de_oficio:          number;
  suspension_temporal:     number;
  perdida:                 number;
  leads_contactados:       number;
  // Actividad de llamadas
  total_llamadas:          number;
  llamadas_contestadas:    number;
  llamadas_no_contestadas: number;
  contestadas:             number;
  // Desglose de llamadas por resultado
  llamadas_sin_resultado:      number;
  llamadas_no_interesado:      number;
  llamadas_interesado:         number;
  llamadas_no_contesta:        number;
  llamadas_volver_llamar:      number;
  llamadas_solicita_info:      number;
  llamadas_num_equivocado:     number;
  llamadas_fuera_servicio:     number;
  llamadas_buzon_voz:          number;
  llamadas_tiene_proveedor:    number;
  // Cobertura de prospección
  prospectos_con_llamadas:     number;
  prospectos_sin_llamadas:     number;
}

export async function upsertContactoSecundario(
  prospectoId: string,
  contacto: { id?: string; nombre: string; cargo?: string; telefono?: string; email?: string }
) {
  const { data } = await api.post(`/prospectos/${prospectoId}/contactos`, contacto);
  return data.data;
}

export async function eliminarContactoSecundario(prospectoId: string, contactoId: string) {
  await api.delete(`/prospectos/${prospectoId}/contactos/${contactoId}`);
}

export async function getResumenProspectos(): Promise<ResumenProspectos> {
  const { data } = await api.get("/prospectos/resumen");
  return data.data;
}

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


export async function importarProspectos(prospectos: any[]) {
  const res = await api.post("/crm/prospectos/importar", { prospectos });
  return res.data;
}

export async function getMotivosPerdida() {
  const { data } = await api.get("/prospectos/motivos-perdida");
  return data.data as Array<{ motivo_perdida: string; total: number }>;
}

export interface PipelineEtapa {
  prospectos: Prospecto[];
  total:      number;
  valor:      number;
  valor_pen:  number;
  valor_usd:  number;
}

export interface PipelineData {
  pipeline:      Record<string, PipelineEtapa>;
  valorPerdido:  number;
}

export async function getPipeline(): Promise<PipelineData> {
  const { data } = await api.get("/prospectos/pipeline");
  return data.data as PipelineData;
}

export async function actualizarEtapaPipeline(id: string, etapa: string) {
  const { data } = await api.patch(`/prospectos/${id}/etapa`, { etapa });
  return data.data as Prospecto;
}

export async function actualizarEstadoLead(id: string, estado_lead: string) {
  await api.patch(`/prospectos/${id}/estado-lead`, { estado_lead });
}

export interface FunnelEtapa {
  etapa:      string;
  total:      number;
  valor:      number;
  conversion: number | null;
  ganadas?:   number;
  perdidas?:  number;
}

export interface RegionEtapa {
  zona:                 string;
  total:                number;
  cerrados:             number;
  activos:              number;
  valor:                number;
  llamadas:             number;
  llamadas_contestadas: number;
  reuniones:            number;
  brochures:            number;
  propuestas:           number;
  propuestas_ganadas:   number;
}

export async function getFunnelPipeline() {
  const { data } = await api.get("/prospectos/funnel");
  return data.data as FunnelEtapa[];
}

export interface EtapaLead {
  id:              string;
  empresa:         string;
  nombre_contacto: string | null;
  telefono:        string | null;
  ciudad:          string | null;
  etapa_pipeline:  string;
  creado_en:       string;
  ultima_llamada:  string | null;
  total_propuestas: number;
  valor_pipeline:  number;
}

export async function getEtapaLeads(etapa: string): Promise<EtapaLead[]> {
  const { data } = await api.get("/prospectos/etapa-leads", { params: { etapa } });
  return data.data;
}

export async function getAnalisisRegion() {
  const { data } = await api.get("/prospectos/por-region");
  return data.data as RegionEtapa[];
}

export interface ScoreLead {
  id:               string;
  score:            number;
  nivel:            "caliente" | "activo" | "tibio" | "frio";
  empresa:          string;
  etapa_pipeline:   string;
  dias_en_pipeline: number;
}

export async function getScoresLeads(params?: {
  periodo?: string;
  mes?:     number;
  anio?:    number;
  fecha?:   string;
}) {
  const { data } = await api.get("/prospectos/scores", { params });
  return data.data as ScoreLead[];
}

export interface ScoreHistoryEntry {
  score:         number;
  nivel:         string;
  registrado_en: string;
}

export async function getScoreHistory(id: string) {
  const { data } = await api.get(`/prospectos/${id}/score-history`);
  return data.data as ScoreHistoryEntry[];
}

export interface CicloVentaKPIs {
  total_cerrados:              number;
  promedio_dias:               number | null;
  min_dias:                    number | null;
  max_dias:                    number | null;
  promedio_contacto_propuesta: number | null;
  promedio_propuesta_cierre:   number | null;
}
export interface CicloVentaPorRubro {
  rubro:         string;
  total:         number;
  promedio_dias: number;
}
export interface ProspectoEnRiesgo {
  id:                    string;
  empresa:               string;
  nombre_contacto:       string | null;
  etapa_pipeline:        string;
  fecha_primer_contacto: string;
  dias_en_pipeline:      number;
}
export interface CicloVentaTendencia {
  mes:           string;
  cerrados:      number;
  promedio_dias: number;
}
export interface CicloVentaDetalle {
  id:                       string;
  empresa:                  string;
  nombre_contacto:          string | null;
  rubro:                    string | null;
  fecha_primer_contacto:    string;
  fecha_primera_propuesta:  string | null;
  fecha_cierre:             string;
  dias_ciclo:               number;
  dias_contacto_propuesta:  number | null;
  dias_propuesta_cierre:    number | null;
  valor_cerrado:            number;
}
export interface CicloVentaPorServicio {
  servicio:      string;
  total:         number;
  promedio_dias: number;
}
export interface CicloVentaData {
  kpis:         CicloVentaKPIs;
  por_rubro:    CicloVentaPorRubro[];
  por_servicio: CicloVentaPorServicio[];
  en_riesgo:    ProspectoEnRiesgo[];
  tendencia:    CicloVentaTendencia[];
  detalle:      CicloVentaDetalle[];
}

export async function getCicloVenta(anio?: number): Promise<CicloVentaData> {
  const params = anio ? { anio } : {};
  const { data } = await api.get("/prospectos/ciclo-venta", { params });
  return data.data as CicloVentaData;
}

export interface EstadoWebItem {
  estado_web: string;
  total:      number;
}
export interface EstadoWebProspecto {
  id:              string;
  empresa:         string;
  pagina_web:      string | null;
  proveedor_web:   string | null;
  estado_web:      string;
  region:          string | null;
  ciudad:          string | null;
  nombre_contacto: string | null;
  telefono:        string | null;
  estado_lead:     string | null;
  clasificacion:   string | null;
  prioridad:       string | null;
  canal_llamada:   string | null;
  contesto:        boolean | null;
}
export interface EstadoWebData {
  distribucion: EstadoWebItem[];
  prospectos:   EstadoWebProspecto[];
}

export async function getEstadoWebDistribucion(): Promise<EstadoWebData> {
  const { data } = await api.get("/prospectos/estado-web");
  return data.data as EstadoWebData;
}
