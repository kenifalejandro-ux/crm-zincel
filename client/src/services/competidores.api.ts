import api from "./api";
import { Competidor, PageBusqueda, SnapshotCompetidor } from "../types/competidores.types";

export const getCompetidores = async (empresa: string): Promise<Competidor[]> => {
  const { data } = await api.get("/competidores", { params: { empresa } });
  return data.data ?? [];
};

export const lookupPagina = async (url: string, empresa: string): Promise<PageBusqueda> => {
  const { data } = await api.get("/competidores/lookup", { params: { url, empresa } });
  return data.data;
};

export const agregarCompetidor = async (empresa: string, pagina_id: string): Promise<Competidor> => {
  const { data } = await api.post("/competidores", { empresa, pagina_id });
  return data.data;
};

export const agregarCompetidorManual = async (
  empresa: string,
  nombre: string,
  seguidores: number,
  url_pagina?: string
): Promise<Competidor> => {
  const { data } = await api.post("/competidores/manual", { empresa, nombre, seguidores, url_pagina });
  return data.data;
};

export const actualizarSeguidores = async (id: string, seguidores: number): Promise<void> => {
  await api.patch(`/competidores/${id}/seguidores`, { seguidores });
};

export const eliminarCompetidor = async (id: string): Promise<void> => {
  await api.delete(`/competidores/${id}`);
};

export const syncCompetidores = async (empresa: string): Promise<{ total: number; ok: number; errores: number }> => {
  const { data } = await api.post("/competidores/sync", { empresa });
  return data;
};

export const getHistoriaCompetidor = async (id: string, dias = 90): Promise<SnapshotCompetidor[]> => {
  const { data } = await api.get(`/competidores/${id}/historia`, { params: { dias } });
  return data.data ?? [];
};
