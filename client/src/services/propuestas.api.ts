/** client/src/services/propuestas.api.ts */

import api from "./api";
import type { Propuesta, FormPropuesta } from "../types/propuesta.types";

export async function getPropuestas(prospecto_id: string): Promise<Propuesta[]> {
  const { data } = await api.get("/propuestas", { params: { prospecto_id } });
  return data.data;
}

export async function crearPropuesta(
  payload: Omit<FormPropuesta, "monto_propuesto" | "monto_cerrado" | "tipo_cambio" | "motivo_cierre_perdido"> & {
    prospecto_id:          string;
    monto_propuesto:       number;
    monto_cerrado?:        number | null;
    tipo_cambio:           number;
    motivo_cierre_perdido?: string | null;
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
    fecha_propuesta:       string;
    fecha_negociacion:     string | null;
    fecha_cierre:          string | null;
    notas:                 string;
    motivo_cierre_perdido: string | null;
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

export async function getResumenEstadosPropuestas(params?: {
  periodo?: string;
  mes?:     number;
  anio?:    number;
  fecha?:   string;
}): Promise<ResumenEstadoPropuesta[]> {
  const { data } = await api.get("/propuestas/resumen-estados", { params });
  return data.data;
}

export interface PropuestaMes {
  mes_num:       number;
  total:         number;
  enviadas:      number;
  en_negociacion: number;
  ganadas:       number;
  perdidas:      number;
}

export async function getPropuestasPorMes(anio?: number): Promise<PropuestaMes[]> {
  const { data } = await api.get("/propuestas/por-mes", { params: anio ? { anio } : {} });
  return data.data;
}

export interface PaqueteWebStat {
  paquete:        string;
  cotizados:      number;
  vendidos:       number;
  precio_promedio: number;
}

export async function getPaquetesWeb(): Promise<PaqueteWebStat[]> {
  const { data } = await api.get("/propuestas/paquetes-web");
  return data.data;
}

// ─── Kanban de oportunidades ──────────────────────────────────────────────────

export interface OportunidadKanban {
  id:                    string;
  servicio:              string;
  descripcion:           string;
  estado:                string;
  monto_propuesto:       number;
  monto_cerrado:         number | null;
  moneda:                string;
  tipo_cambio:           number;
  fecha_propuesta:       string;
  fecha_negociacion:     string | null;
  fecha_cierre:          string | null;
  notas:                 string | null;
  motivo_cierre_perdido: string | null;
  prospecto_id:          string;
  empresa:               string;
  nombre_contacto:       string | null;
  telefono:              string | null;
  ciudad:                string | null;
}

export interface KanbanOportunidadesData {
  porEstado: Record<string, OportunidadKanban[]>;
  stats:     { total_activo: number; total_ganado: number };
}

export async function getKanbanOportunidades(): Promise<KanbanOportunidadesData> {
  const { data } = await api.get("/propuestas/kanban");
  return data.data;
}

// ─── Analisis Pipeline ────────────────────────────────────────────────────────

export interface EmpresaAnalisis {
  prospecto_id:  string;
  empresa:       string;
  telefono:      string | null;
  ciudad:        string | null;
  total:         number;
  enviadas:      number;
  en_negociacion: number;
  ganadas:       number;
  perdidas:      number;
  monto_activo:  number;
  monto_ganado:  number;
}

export interface ServicioAnalisis {
  servicio:      string;
  total:         number;
  enviadas:      number;
  en_negociacion: number;
  ganadas:       number;
  perdidas:      number;
  monto_activo:  number;
  monto_ganado:  number;
}

export interface MesActual {
  propuestas_activas: number;
  propuestas_anio:    number;
  cierres_total:      number;
  cierres_anio:       number;
  ingresos_total:     number;
  valor_activo:       number;
  resueltas_total:    number;
}

export interface DetallePropuesta {
  id:                    string;
  servicio:              string;
  estado:                string;
  fecha_propuesta:       string;
  monto_propuesto:       number;
  monto_cerrado:         number | null;
  moneda:                string;
  tipo_cambio:           number;
  motivo_cierre_perdido: string | null;
  prospecto_id:          string;
  empresa:               string;
}

export interface AnalisisPipelineData {
  por_empresa:      EmpresaAnalisis[];
  por_servicio:     ServicioAnalisis[];
  mes_actual:       MesActual;
  detalle_empresa:  Record<string, DetallePropuesta[]>;
  detalle_servicio: Record<string, DetallePropuesta[]>;
}

export async function getAnalisisPipeline(): Promise<AnalisisPipelineData> {
  const { data } = await api.get("/propuestas/analisis-pipeline");
  return data.data;
}

export interface MetasPipeline {
  propuestas_mes: number;
  cierres_mes:    number;
  ingresos_mes:   number;
}

export async function getMetasPipeline(): Promise<MetasPipeline> {
  const { data } = await api.get("/propuestas/metas-pipeline");
  return data.data;
}

export async function actualizarMetasPipeline(metas: MetasPipeline): Promise<MetasPipeline> {
  const { data } = await api.put("/propuestas/metas-pipeline", metas);
  return data.data;
}
