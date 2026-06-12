/** client/src/types/analisisEmpresas.types.ts */

import type { EstadoIndicador, SemaforoFinanciero } from "./finanzas.types";

export interface EmpresaAnalisis {
  id:                   string;
  nombre:               string;
  sector:               string | null;
  moneda:               "PEN" | "USD";
  notas:                string | null;
  total_periodos:       number;
  ultimo_periodo_fecha: string | null;
  ultimo_periodo_label: string | null;
  ultimo_periodo_id:    string | null;
  liquidez_actual:      number | null;
  roe_actual:           number | null;
  endeudamiento_actual: number | null;
  creado_en:            string;
  actualizado_en:       string;
}

export interface PeriodoFinanciero {
  id:                          string;
  empresa_id:                  string;
  periodo:                     string;
  fecha_periodo:               string;
  caja_bancos:                 number;
  cuentas_por_cobrar:          number;
  otros_activos_corrientes:    number;
  activo_fijo:                 number;
  otros_activos_no_corrientes: number;
  pasivos_corrientes:          number;
  pasivos_no_corrientes:       number;
  patrimonio:                  number;
  utilidad_ejercicio:          number;
  ventas_netas:                number;
  notas:                       string | null;
  creado_en:                   string;
  actualizado_en:              string;
}

export interface FormEmpresa {
  nombre:  string;
  sector:  string;
  moneda:  "PEN" | "USD";
  notas:   string;
}

export interface FormPeriodo {
  periodo:                     string;
  fecha_periodo:               string;
  caja_bancos:                 string;
  cuentas_por_cobrar:          string;
  otros_activos_corrientes:    string;
  activo_fijo:                 string;
  otros_activos_no_corrientes: string;
  pasivos_corrientes:          string;
  pasivos_no_corrientes:       string;
  patrimonio:                  string;
  utilidad_ejercicio:          string;
  ventas_netas:                string;
  notas:                       string;
}

export interface IndicadorConGauge {
  valor:     number | null;
  estado:    EstadoIndicador;
  gauge_pct: number;
}

export interface AnalisisEmpresa {
  empresa:  EmpresaAnalisis;
  periodo:  PeriodoFinanciero;
  calculado: {
    activos_corrientes: number;
    activos_totales:    number;
    pasivos_corrientes: number;
    pasivos_totales:    number;
  };
  indicadores: {
    liquidez_corriente:       IndicadorConGauge;
    capital_trabajo:          IndicadorConGauge;
    endeudamiento:            IndicadorConGauge;
    deuda_patrimonio:         IndicadorConGauge;
    roe:                      IndicadorConGauge;
    roa:                      IndicadorConGauge;
    concentracion_cxc:        IndicadorConGauge;
    disponibilidad_inmediata: IndicadorConGauge;
    margen_neto:              IndicadorConGauge;
  };
  composicion_activos:  { nombre: string; valor: number; porcentaje: number; color: string }[];
  composicion_pasivos:  { nombre: string; valor: number; porcentaje: number; color: string }[];
  evolucion: {
    periodo:            string;
    fecha_periodo:      string;
    liquidez_corriente: number | null;
    endeudamiento:      number | null;
    roe:                number | null;
    roa:                number | null;
    disponibilidad:     number | null;
  }[];
  hallazgos:       { tipo: "positivo" | "negativo"; texto: string }[];
  recomendaciones: string[];
  semaforo:        SemaforoFinanciero;
  total_periodos:  number;
}
