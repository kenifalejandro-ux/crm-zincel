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