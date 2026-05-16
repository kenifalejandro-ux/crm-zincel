/** client/src/services/configuracion.api.ts */

import api from "./api";

export interface TipoCambio {
  valor:          number;
  actualizado_en: string;
}

export async function getTipoCambio(): Promise<TipoCambio> {
  const { data } = await api.get("/configuracion/tipo-cambio");
  return data.data;
}

export async function guardarTipoCambio(valor: number): Promise<TipoCambio> {
  const { data } = await api.put("/configuracion/tipo-cambio", { valor });
  return data.data;
}

export async function actualizarTipoCambioDesdeAPI(): Promise<TipoCambio> {
  const { data } = await api.post("/configuracion/tipo-cambio/actualizar");
  return data.data;
}
