/**client/src/services/finanzas.api.ts*/

import api from "./api";
import type { FormIngreso, FormEgreso } from "../types/finanzas.types";

// ── INGRESOS ──────────────────────────────────────────────────

export async function getIngresos(filtros?: {
  desde?: string;
  hasta?: string;
  estado?: string;
  mes?: number;
  anio?: number;
}) {
  const { data } = await api.get("/finanzas/ingresos", { params: filtros });
  return data.data;
}

export async function crearIngreso(payload: Omit<FormIngreso, "monto_total" | "adelanto"> & {
  monto_total: number;
  adelanto:    number;
}) {
  const { data } = await api.post("/finanzas/ingresos", payload);
  return data.data;
}

export async function actualizarIngreso(id: string, payload: any) {
  const { data } = await api.put(`/finanzas/ingresos/${id}`, payload);
  return data.data;
}

export async function eliminarIngreso(id: string) {
  const { data } = await api.delete(`/finanzas/ingresos/${id}`);
  return data;
}

export async function eliminarIngresosMasivo(ids: string[]) {
  const { data } = await api.delete("/finanzas/ingresos", { data: { ids } });
  return data;
}

// ── EGRESOS ───────────────────────────────────────────────────

export async function getEgresos(filtros?: {
  categoria?: string;
  estado?:    string;
  mes?:       number;
  anio?:      number;
}) {
  const { data } = await api.get("/finanzas/egresos", { params: filtros });
  return data.data;
}

export async function crearEgreso(payload: Omit<FormEgreso, "monto"> & { monto: number }) {
  const { data } = await api.post("/finanzas/egresos", payload);
  return data.data;
}

export async function actualizarEgreso(id: string, payload: any) {
  const { data } = await api.put(`/finanzas/egresos/${id}`, payload);
  return data.data;
}

export async function eliminarEgreso(id: string) {
  const { data } = await api.delete(`/finanzas/egresos/${id}`);
  return data;
}

export async function eliminarEgresosMasivo(ids: string[]) {
  const { data } = await api.delete("/finanzas/egresos", { data: { ids } });
  return data;
}

// ── PRÉSTAMOS ─────────────────────────────────────────────────

export async function getPrestamos(filtros?: { estado?: string }) {
  const { data } = await api.get("/finanzas/prestamos", { params: filtros });
  return data.data;
}

export async function crearPrestamo(payload: any) {
  const { data } = await api.post("/finanzas/prestamos", payload);
  return data.data;
}

export async function actualizarPrestamo(id: string, payload: any) {
  const { data } = await api.put(`/finanzas/prestamos/${id}`, payload);
  return data.data;
}

export async function eliminarPrestamo(id: string) {
  const { data } = await api.delete(`/finanzas/prestamos/${id}`);
  return data;
}

export async function eliminarPrestamosMasivo(ids: string[]) {
  const { data } = await api.delete("/finanzas/prestamos", { data: { ids } });
  return data;
}

// ── RESUMEN ───────────────────────────────────────────────────

export async function getResumenFinanciero(filtros?: { mes?: number; anio?: number; tipo_cambio?: number }) {
  const { data } = await api.get("/finanzas/resumen", { params: filtros });
  return data.data;
}
