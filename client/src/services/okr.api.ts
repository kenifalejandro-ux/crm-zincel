/** client/src/services/okr.api.ts */

import api from "./api";
import type { Okr, KeyResult, TipoMetricaOkr } from "../types/okr.types";

export const getOkrs = async (): Promise<Okr[]> => {
  const { data } = await api.get("/okr");
  return data.data;
};

export const createOkr = async (payload: {
  titulo: string;
  descripcion?: string;
  trimestre: number;
  anio: number;
}): Promise<Okr> => {
  const { data } = await api.post("/okr", payload);
  return data.data;
};

export const updateOkr = async (
  id: string,
  payload: Partial<{ titulo: string; descripcion: string; trimestre: number; anio: number }>,
): Promise<Okr> => {
  const { data } = await api.put(`/okr/${id}`, payload);
  return data.data;
};

export const deleteOkr = async (id: string): Promise<void> => {
  await api.delete(`/okr/${id}`);
};

export const addKeyResult = async (
  okrId: string,
  payload: {
    titulo: string;
    tipo_metrica: TipoMetricaOkr;
    valor_objetivo: number;
    valor_actual?: number;
  },
): Promise<KeyResult> => {
  const { data } = await api.post(`/okr/${okrId}/kr`, payload);
  return data.data;
};

export const updateKeyResult = async (
  okrId: string,
  krId: string,
  payload: Partial<{ titulo: string; valor_objetivo: number; valor_actual: number }>,
): Promise<KeyResult> => {
  const { data } = await api.put(`/okr/${okrId}/kr/${krId}`, payload);
  return data.data;
};

export const deleteKeyResult = async (okrId: string, krId: string): Promise<void> => {
  await api.delete(`/okr/${okrId}/kr/${krId}`);
};
