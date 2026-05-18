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
