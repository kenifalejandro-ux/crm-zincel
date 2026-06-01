/** client/src/types/okr.types.ts */

export type TipoMetricaOkr =
  | "nuevos_clientes"
  | "ingresos_facturados"
  | "propuestas_enviadas"
  | "tasa_cierre"
  | "prospectos_calificados"
  | "reuniones_realizadas"
  | "manual";

export type EstadoOkr = "encamino" | "riesgo" | "critico";

export interface KeyResult {
  id: string;
  okr_id: string;
  titulo: string;
  tipo_metrica: TipoMetricaOkr;
  valor_objetivo: number;
  valor_actual: number;
  valor_real?: number;
  progreso_pct?: number;
  creado_en: string;
}

export interface Okr {
  id: string;
  titulo: string;
  descripcion?: string;
  trimestre: number;
  anio: number;
  activo: boolean;
  key_results: KeyResult[];
  progreso_total: number;
  estado: EstadoOkr;
  creado_en: string;
}
