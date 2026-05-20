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
}

export async function getPipeline() {
  const { data } = await api.get("/prospectos/pipeline");
  return data.data as Record<string, PipelineEtapa>;
}

export async function actualizarEtapaPipeline(id: string, etapa: string, valor_estimado?: number | null) {
  const { data } = await api.patch(`/prospectos/${id}/etapa`, { etapa, valor_estimado });
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
