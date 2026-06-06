/** client/src/services/metaProyeccion.api.ts */

import api from "./api";

export interface ProyeccionConfig {
  empresa:           string;
  cpl_umbral:        number | null;
  fase_campana:      "aprendizaje" | "calibracion" | "escalado";
  vendedor_email:    string | null;
  vendedor_whatsapp: string | null;
}

export async function getProyeccionConfig(empresa: string): Promise<ProyeccionConfig | null> {
  try {
    const { data } = await api.get("/meta-cuentas/proyeccion", { params: { empresa } });
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function saveProyeccionConfig(config: ProyeccionConfig): Promise<ProyeccionConfig> {
  const { data } = await api.put("/meta-cuentas/proyeccion", config);
  return data.data;
}
