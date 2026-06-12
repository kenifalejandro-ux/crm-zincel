/** client/src/services/analisisEmpresas.api.ts */

import api from "./api";
import type { FormEmpresa, FormPeriodo } from "../types/analisisEmpresas.types";

const BASE = "/empresas-analisis";

// ── EMPRESAS ──────────────────────────────────────────────────

export const getEmpresas = async () => {
  const { data } = await api.get(BASE);
  return data.data;
};

export const crearEmpresa = async (payload: Partial<FormEmpresa>) => {
  const { data } = await api.post(BASE, payload);
  return data.data;
};

export const actualizarEmpresa = async (id: string, payload: Partial<FormEmpresa>) => {
  const { data } = await api.put(`${BASE}/${id}`, payload);
  return data.data;
};

export const eliminarEmpresa = async (id: string) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};

// ── PERÍODOS ──────────────────────────────────────────────────

export const getPeriodos = async (empresaId: string) => {
  const { data } = await api.get(`${BASE}/${empresaId}/periodos`);
  return data.data;
};

export const crearPeriodo = async (empresaId: string, payload: Partial<FormPeriodo>) => {
  const { data } = await api.post(`${BASE}/${empresaId}/periodos`, toNumbers(payload));
  return data.data;
};

export const actualizarPeriodo = async (id: string, payload: Partial<FormPeriodo>) => {
  const { data } = await api.put(`${BASE}/periodos/${id}`, toNumbers(payload));
  return data.data;
};

export const eliminarPeriodo = async (id: string) => {
  const { data } = await api.delete(`${BASE}/periodos/${id}`);
  return data;
};

// ── ANÁLISIS ──────────────────────────────────────────────────

export const getAnalisisEmpresa = async (empresaId: string, periodoId: string) => {
  const { data } = await api.get(`${BASE}/${empresaId}/analisis`, {
    params: { periodo_id: periodoId },
  });
  return data.data;
};

// ── HELPERS ──────────────────────────────────────────────────

function toNumbers(form: Partial<FormPeriodo>) {
  const numCols = [
    "caja_bancos", "cuentas_por_cobrar", "otros_activos_corrientes",
    "activo_fijo", "otros_activos_no_corrientes", "pasivos_corrientes",
    "pasivos_no_corrientes", "patrimonio", "utilidad_ejercicio", "ventas_netas",
  ] as const;
  const result: any = { ...form };
  for (const col of numCols) {
    if (col in result) result[col] = parseFloat(result[col] ?? "0") || 0;
  }
  return result;
}
