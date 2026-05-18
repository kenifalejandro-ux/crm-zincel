import api from "./api";
import { MetaCuenta, MetaCuentaForm } from "../types/metaCuentas.types";

export const getMetaCuentas = async (): Promise<MetaCuenta[]> => {
  const { data } = await api.get("/meta-cuentas");
  return data.data;
};

export const createMetaCuenta = async (form: MetaCuentaForm): Promise<MetaCuenta> => {
  const { data } = await api.post("/meta-cuentas", form);
  return data.data;
};

export const updateMetaCuenta = async (id: string, form: Partial<MetaCuentaForm>): Promise<MetaCuenta> => {
  const { data } = await api.put(`/meta-cuentas/${id}`, form);
  return data.data;
};

export const deleteMetaCuenta = async (id: string): Promise<void> => {
  await api.delete(`/meta-cuentas/${id}`);
};
