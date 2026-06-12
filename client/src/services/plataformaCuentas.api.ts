import api from "./api";
import { PlataformaCuenta, PlataformaCuentaForm } from "../types/plataformaCuentas.types";

export const getPlataformaCuentas = async (): Promise<PlataformaCuenta[]> => {
  const { data } = await api.get("/plataforma-cuentas");
  return data.data;
};

export const getEmpresasConCuentas = async (): Promise<string[]> => {
  const { data } = await api.get("/plataforma-cuentas/empresas");
  return data.data;
};

export const getPlataformasDeEmpresa = async (empresa: string): Promise<string[]> => {
  const { data } = await api.get(`/plataforma-cuentas/empresa/${encodeURIComponent(empresa)}/plataformas`);
  return data.data;
};

export const createPlataformaCuenta = async (form: PlataformaCuentaForm): Promise<PlataformaCuenta> => {
  const { data } = await api.post("/plataforma-cuentas", form);
  return data.data;
};

export const updatePlataformaCuenta = async (id: string, form: Partial<PlataformaCuentaForm>): Promise<PlataformaCuenta> => {
  const { data } = await api.put(`/plataforma-cuentas/${id}`, form);
  return data.data;
};

export const deletePlataformaCuenta = async (id: string): Promise<void> => {
  await api.delete(`/plataforma-cuentas/${id}`);
};

export const syncManualCuenta = async (empresa: string, plataforma: string): Promise<{ ok: boolean; total?: number; insertados?: number; duplicados?: number }> => {
  const hoy   = new Date().toISOString().split("T")[0];
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (plataforma === "meta") {
    const { data } = await api.post("/meta-ads/sync", { empresa, desde, hasta: hoy });
    return data;
  } else if (plataforma === "tiktok") {
    const { data } = await api.post("/tiktok-ads/sync", { empresa, desde, hasta: hoy });
    return data;
  } else if (plataforma === "google") {
    const { data } = await api.post("/google-ads/sync", { empresa, desde, hasta: hoy });
    return data;
  }
  throw new Error("Plataforma no soportada");
};
