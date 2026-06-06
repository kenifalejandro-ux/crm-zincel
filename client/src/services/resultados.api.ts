/** client/src/services/resultados.api.ts */

import api from "./api";
import type { Resultado, ResultadoInput, ResumenCampana } from "../types/resultado.types";

export async function listarResultados(params?: { empresa?: string; metrica_id?: string }): Promise<Resultado[]> {
  const { data } = await api.get("/resultados", { params });
  return data.data;
}

export async function crearResultado(input: ResultadoInput): Promise<Resultado> {
  const { data } = await api.post("/resultados", input);
  return data.data;
}

export async function actualizarResultado(id: string, input: Partial<ResultadoInput>): Promise<Resultado> {
  const { data } = await api.put(`/resultados/${id}`, input);
  return data.data;
}

export async function eliminarResultado(id: string): Promise<void> {
  await api.delete(`/resultados/${id}`);
}

export async function resumenCampana(metrica_id: string): Promise<ResumenCampana> {
  const { data } = await api.get(`/resultados/resumen/${metrica_id}`);
  return data.data;
}
