/**client/src/services/prospectos.api.ts*/

import api from "./api";
import type { FiltrosProspecto, Prospecto } from "../types/prospecto.types";

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

export async function getPipeline() {
  const { data } = await api.get("/prospectos/pipeline");
  return data.data as Record<string, PipelineEtapa>;
}

export async function actualizarEtapaPipeline(id: string, etapa: string) {
  const { data } = await api.patch(`/prospectos/${id}/etapa`, { etapa });
  return data.data as Prospecto;
}

export interface FunnelEtapa {
  etapa:      string;
  total:      number;
  valor:      number;
  conversion: number | null;
}

export interface RegionEtapa {
  zona:    string;
  total:   number;
  cerrados: number;
  activos: number;
  valor:   number;
}

export async function getFunnelPipeline() {
  const { data } = await api.get("/prospectos/funnel");
  return data.data as FunnelEtapa[];
}

export async function getAnalisisRegion() {
  const { data } = await api.get("/prospectos/por-region");
  return data.data as RegionEtapa[];
}

export interface ScoreLead {
  id:    string;
  score: number;
  nivel: "caliente" | "activo" | "tibio" | "frio";
}

export async function getScoresLeads() {
  const { data } = await api.get("/prospectos/scores");
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
export interface CicloVentaData {
  kpis:       CicloVentaKPIs;
  por_rubro:  CicloVentaPorRubro[];
  en_riesgo:  ProspectoEnRiesgo[];
  tendencia:  CicloVentaTendencia[];
  detalle:    CicloVentaDetalle[];
}

export async function getCicloVenta(): Promise<CicloVentaData> {
  const { data } = await api.get("/prospectos/ciclo-venta");
  return data.data as CicloVentaData;
}
