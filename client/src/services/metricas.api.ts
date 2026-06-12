/** src/services/metricas.api.ts */

import api from "./api";
import {
  Metrica, FormMetrica,
  ResumenPlataforma, FiltrosMetrica,
} from "../types/metricas.types";

export const getMetricas = async (filtros?: FiltrosMetrica): Promise<Metrica[]> => {
  const { data } = await api.get("/metricas", { params: filtros });
  return data.data ?? data;
};

export const getMetricaById = async (id: string): Promise<Metrica> => {
  const { data } = await api.get(`/metricas/${id}`);
  return data;
};

export const createMetrica = async (form: FormMetrica): Promise<Metrica> => {
  const payload = {
    ...form,
    sub_plataforma:     form.sub_plataforma     || null,
    impresiones:        parseFloat(form.impresiones)        || 0,
    alcance:            parseFloat(form.alcance)            || 0,
    clics:              parseFloat(form.clics)              || 0,
    ctr:                parseFloat(form.ctr)                || 0,
    gasto:              parseFloat(form.gasto)              || 0,
    cpc:                parseFloat(form.cpc)                || 0,
    cpm:                parseFloat(form.cpm)                || 0,
    cpa:                parseFloat(form.cpa)                || 0,
    ingresos:           parseFloat(form.ingresos)           || 0,
    costo_total:        parseFloat(form.costo_total)        || 0,
    conversiones:       parseFloat(form.conversiones)       || 0,
    leads:              parseFloat(form.leads)              || 0,
    mensajes:           parseFloat(form.mensajes)           || 0,
    roas:               parseFloat(form.roas)               || 0,
    roi:                parseFloat(form.roi)                || 0,
    costo_por_lead:     parseFloat(form.costo_por_lead)     || 0,
    seguidores_ganados: parseFloat(form.seguidores_ganados) || 0,
    perfil_visitas:     parseFloat(form.perfil_visitas)     || 0,
    frecuencia:         parseFloat(form.frecuencia)         || 0,
    interacciones:      parseFloat(form.interacciones)      || 0,
    me_gusta:           parseFloat(form.me_gusta)           || 0,
    comentarios:        parseFloat(form.comentarios)        || 0,
    compartidos:        parseFloat(form.compartidos)        || 0,
    guardados:          parseFloat(form.guardados)          || 0,
    tasa_engagement:    parseFloat(form.tasa_engagement)    || 0,
    costo_por_mensaje:  parseFloat(form.costo_por_mensaje)  || 0,
    reproducciones:     parseFloat(form.reproducciones)     || 0,
    tasa_reproduccion:  parseFloat(form.tasa_reproduccion)  || 0,
  };
  const { data } = await api.post("/metricas", payload);
  return data.data ?? data;
};

export const updateMetrica = async (id: string, form: Partial<FormMetrica>): Promise<Metrica> => {
  const { data } = await api.put(`/metricas/${id}`, form);
  return data;
};

export const deleteMetrica = async (id: string): Promise<void> => {
  await api.delete(`/metricas/${id}`);
};

export const deleteMetricasMasivo = async (ids: string[]): Promise<void> => {
  await api.delete("/metricas/masivo", { data: { ids } });
};

export const getResumenPorEmpresa = async (empresa: string): Promise<ResumenPlataforma[]> => {
  const { data } = await api.get("/metricas/resumen", { params: { empresa } });
  return data.data ?? data;
};

export const getHistoricoPlataforma = async (empresa?: string): Promise<HistoricoPlataforma[]> => {
  const { data } = await api.get("/metricas/historico-plataforma", { params: empresa ? { empresa } : {} });
  return data.data ?? [];
};

export interface HistoricoPlataforma {
  plataforma:        "meta" | "google" | "tiktok";
  campanas:          number;
  gasto_total:       number;
  leads_total:       number;
  clics_total:       number;
  impresiones_total: number;
  mensajes_total:    number;
  cpl_promedio:      number;
  cpc_promedio:      number;
  ctr_promedio:      number;
  meses_con_datos:   number;
  fecha_inicio:      string;
  fecha_fin:         string;
}

export interface FormatoData {
  formato:              "instáform" | "trafico_mensajes";
  campanas:             number;
  gasto_total:          number;
  impresiones_total:    number;
  clics_total:          number;
  mensajes_total:       number;
  leads_total:          number;
  ctr_promedio:         number;
  cpm_promedio:         number;
  cpc_promedio:         number;
  frecuencia_promedio:  number;
  ventas:               number;
  revenue_total:        number;
  costo_venta_total:    number;
  costo_por_mensaje:    number | null;
  costo_por_lead:       number | null;
  mensajes_por_1000_imp: number | null;
  leads_por_1000_imp:   number | null;
  roas_real:            number | null;
  costo_por_venta:      number | null;
  margen_pct:           number | null;
}

export const getFormatos = async (empresa?: string): Promise<FormatoData[]> => {
  const { data } = await api.get("/metricas/formatos", { params: empresa ? { empresa } : {} });
  return data.data ?? [];
};

export const getEmpresasMetricas = async (): Promise<string[]> => {
  const { data } = await api.get("/metricas/empresas");
  return data.data ?? [];
};

export const getProyectos = async (empresa?: string): Promise<string[]> => {
  const { data } = await api.get("/metricas/proyectos", { params: empresa ? { empresa } : {} });
  return data.data ?? [];
};

export const asignarProyectosBulk = async (ids: string[], proyectos: string[]): Promise<void> => {
  await api.put("/metricas/bulk-proyecto", { ids, proyectos });
};

export const actualizarProyectosMetrica = async (id: string, proyectos: string[]): Promise<void> => {
  await api.put(`/metricas/${id}/proyectos`, { proyectos });
};

export const refreshMetrica = async (id: string): Promise<Metrica> => {
  const { data } = await api.post(`/metricas/${id}/refresh`);
  return data.data;
};

export const getAlertasMetricas = async (empresa?: string): Promise<AlertaMetrica[]> => {
  const { data } = await api.get("/metricas/alertas", { params: empresa ? { empresa } : {} });
  return data.data ?? [];
};

export interface AlertaMetrica {
  campana_nombre: string;
  plataforma:     string;
  empresa:        string;
  periodo_fin:    string;
  tipo:           "cpl_alto" | "frecuencia_alta" | "ctr_bajo";
  mensaje:        string;
  valor:          number;
}

