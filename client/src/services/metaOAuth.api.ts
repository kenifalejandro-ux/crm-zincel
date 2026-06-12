import api from "./api";

const BASE = "/meta-oauth";

export const getMetaAuthUrl = async (empresa: string, from = "configuracion"): Promise<string> => {
  const { data } = await api.get(`${BASE}/auth-url`, { params: { empresa, from } });
  return data.url;
};

export const getMetaEstado = async (empresa: string): Promise<{ conectado: boolean; vence_en?: string }> => {
  const { data } = await api.get(`${BASE}/estado`, { params: { empresa } });
  return data;
};
