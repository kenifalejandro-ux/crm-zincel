/** client/src/services/propuestas.api.ts */

import api from "./api";
import type { Propuesta, FormPropuesta } from "../types/propuesta.types";

export async function getPropuestas(prospecto_id: string): Promise<Propuesta[]> {
  const { data } = await api.get("/propuestas", { params: { prospecto_id } });
  return data.data;
}

export async function crearPropuesta(
  payload: Omit<FormPropuesta, "monto_propuesto" | "monto_cerrado" | "tipo_cambio"> & {
    prospecto_id:    string;
    monto_propuesto: number;
    monto_cerrado?:  number | null;
    tipo_cambio:     number;
  }
): Promise<Propuesta> {
  const { data } = await api.post("/propuestas", payload);
  return data.data;
}

export async function actualizarPropuesta(
  id: string,
  payload: Partial<{
    servicio:        string;
    descripcion:     string;
    monto_propuesto: number;
    monto_cerrado:   number | null;
    moneda:          string;
    tipo_cambio:     number;
    estado:          string;
    fecha_propuesta:   string;
    fecha_negociacion: string | null;
    fecha_cierre:      string | null;
    notas:             string;
  }>
): Promise<Propuesta> {
  const { data } = await api.put(`/propuestas/${id}`, payload);
  return data.data;
}

export async function eliminarPropuesta(id: string): Promise<void> {
  await api.delete(`/propuestas/${id}`);
}

export interface ResumenEstadoPropuesta {
  estado:      string;
  total:       number;
  monto_total: number;
}

export async function getResumenEstadosPropuestas(): Promise<ResumenEstadoPropuesta[]> {
  const { data } = await api.get("/propuestas/resumen-estados");
  return data.data;
}
