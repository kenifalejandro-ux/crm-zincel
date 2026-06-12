import api from "./api";
import { PostOrganico, MejorHora } from "../types/instagramOrganico.types";

const BASE = "/organico";

export const getPostsOrganicos = async (empresa?: string, plataforma?: string): Promise<PostOrganico[]> => {
  const { data } = await api.get(BASE, {
    params: { ...(empresa ? { empresa } : {}), ...(plataforma ? { plataforma } : {}) },
  });
  return data.data ?? [];
};

export const getMejoresHoras = async (empresa?: string, plataforma?: string): Promise<MejorHora[]> => {
  const { data } = await api.get(`${BASE}/mejores-horas`, {
    params: { ...(empresa ? { empresa } : {}), ...(plataforma ? { plataforma } : {}) },
  });
  return data.data ?? [];
};

export const getTopPosts = async (empresa?: string, limit = 10, plataforma?: string): Promise<PostOrganico[]> => {
  const { data } = await api.get(`${BASE}/top-posts`, {
    params: { ...(empresa ? { empresa } : {}), ...(plataforma ? { plataforma } : {}), limit },
  });
  return data.data ?? [];
};

export const syncInstagramOrganico = async (empresa: string): Promise<{ total: number; insertados: number; actualizados: number }> => {
  const { data } = await api.post(`${BASE}/sync/instagram`, { empresa, limit: 50 });
  return data;
};

export const syncFacebookOrganico = async (empresa: string): Promise<{ total: number; insertados: number; actualizados: number; paginas?: string[] }> => {
  const { data } = await api.post(`${BASE}/sync/facebook`, { empresa, limit: 30 });
  return data;
};

export const syncTikTokOrganico = async (empresa: string): Promise<{ total: number; insertados: number; actualizados: number }> => {
  const { data } = await api.post(`${BASE}/sync/tiktok`, { empresa, limit: 30 });
  return data;
};

export const getTikTokEstado = async (empresa: string): Promise<{ conectado: boolean; expires_at?: string }> => {
  const { data } = await api.get(`${BASE}/tiktok-estado`, { params: { empresa } });
  return data;
};

export const getTikTokAuthUrl = async (empresa: string): Promise<string> => {
  const { data } = await api.get(`${BASE}/tiktok-auth-url`, { params: { empresa } });
  return data.url;
};
