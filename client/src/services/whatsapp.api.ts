import api from "./api";

const BASE = "/whatsapp";

export const enviarWhatsApp = async (
  numero: string,
  mensaje: string,
  prospecto_id?: string,
  empresa?: string
): Promise<{ ok: boolean; wamid: string }> => {
  const { data } = await api.post(`${BASE}/send`, { numero, mensaje, prospecto_id, empresa });
  return data;
};

export const obtenerTemplatesWA = async (): Promise<any[]> => {
  const { data } = await api.get(`${BASE}/templates`);
  return data.data ?? [];
};

export const obtenerHistorialWA = async (
  prospecto_id?: string,
  empresa?: string
): Promise<any[]> => {
  const { data } = await api.get(`${BASE}/historial`, {
    params: { ...(prospecto_id ? { prospecto_id } : {}), ...(empresa ? { empresa } : {}) },
  });
  return data.data ?? [];
};
