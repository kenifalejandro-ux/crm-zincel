/**client/src/types/finanzas.types.ts*/

// ── INGRESOS ──────────────────────────────────────────────────

export type TipoServicio =
  | "desarrollo_web"
  | "wordpress"
  | "diseño_marketing"
  | "redes_sociales"
  | "publicidad_digital"
  | "erp"
  | "crm"
  | "otro";

export type EstadoIngreso = "por_cobrar" | "cobrado_parcial" | "cobrado" | "vencido";
export type Moneda        = "PEN" | "USD";

export interface Ingreso {
  id:               string;
  prospecto_id?:    string;
  propuesta_id?:    string | null;
  empresa:          string;
  descripcion:      string;
  tipo_servicio:    TipoServicio;
  monto_total:      number;
  adelanto:         number;
  saldo_pendiente:  number;
  moneda:           Moneda;
  tipo_cambio:      number;
  estado:           EstadoIngreso;
  fecha:            string;
  fecha_vencimiento?: string;
  notas?:           string;
  creado_en:        string;
  actualizado_en:   string;
}

export interface FormIngreso {
  empresa:           string;
  descripcion:       string;
  tipo_servicio:     TipoServicio;
  monto_total:       string;
  adelanto:          string;
  moneda:            Moneda;
  tipo_cambio:       string;
  estado:            EstadoIngreso;
  fecha:             string;
  fecha_vencimiento: string;
  notas:             string;
}

// ── EGRESOS ───────────────────────────────────────────────────

export type CategoriaEgreso =
  | "publicidad_digital"
  | "herramientas_saas"
  | "herramientas_ia"
  | "infraestructura_digital"
  | "subcontratos";

export type FrecuenciaEgreso = "mensual" | "anual" | "unico";
export type EstadoEgreso     = "pendiente" | "pagado";

export interface Egreso {
  id:                string;
  categoria:         CategoriaEgreso;
  descripcion:       string;
  proveedor?:        string;
  monto:             number;
  moneda:            Moneda;
  tipo_cambio:       number;
  frecuencia:        FrecuenciaEgreso;
  estado:            EstadoEgreso;
  fecha:             string;
  fecha_vencimiento?: string;
  notas?:            string;
  creado_en:         string;
  actualizado_en:    string;
}

export interface FormEgreso {
  categoria:         CategoriaEgreso;
  descripcion:       string;
  proveedor:         string;
  monto:             string;
  moneda:            Moneda;
  tipo_cambio:       string;
  frecuencia:        FrecuenciaEgreso;
  estado:            EstadoEgreso;
  fecha:             string;
  fecha_vencimiento: string;
  notas:             string;
}

// ── PRÉSTAMOS ─────────────────────────────────────────────────

export type CategoriaPrestamo =
  | "herramientas_ia"
  | "infraestructura_digital"
  | "publicidad_digital"
  | "herramientas_saas"
  | "subcontratos"
  | "personal"
  | "otro";

export type EstadoPrestamo = "por_pagar" | "pagado" | "vencido";

export interface Prestamo {
  id:                string;
  categoria:         CategoriaPrestamo;
  descripcion:       string;
  prestamista?:      string;
  monto:             number;
  moneda:            Moneda;
  tipo_cambio:       number;
  estado:            EstadoPrestamo;
  fecha:             string;
  fecha_vencimiento?: string;
  fecha_pago?:       string;
  notas?:            string;
  creado_en:         string;
  actualizado_en:    string;
}

export interface FormPrestamo {
  categoria:         CategoriaPrestamo;
  descripcion:       string;
  prestamista:       string;
  monto:             string;
  moneda:            Moneda;
  tipo_cambio:       string;
  estado:            EstadoPrestamo;
  fecha:             string;
  fecha_vencimiento: string;
  fecha_pago:        string;
  notas:             string;
}

// ── ANÁLISIS FINANCIERO ───────────────────────────────────────

export type EstadoIndicador =
  | "optimo" | "aceptable" | "critico"
  | "riesgo_bajo" | "moderado" | "riesgo_alto" | "alto_riesgo"
  | "excelente" | "bueno" | "por_mejorar"
  | "atencion" | "sin_datos";

export type SemaforoFinanciero = "estable" | "en_riesgo" | "critico";

export interface IndicadorFinanciero {
  valor: number | null;
  estado: EstadoIndicador;
}

export interface AnalisisFinanciero {
  fecha_analisis: string;
  resumen: {
    activos_totales:    number;
    pasivos_totales:    number;
    patrimonio:         number;
    utilidad_ejercicio: number;
    caja_bancos:        number;
    cuentas_por_cobrar: number;
  };
  composicion_activos: { nombre: string; valor: number; porcentaje: number; color: string }[];
  indicadores: {
    liquidez_corriente:       IndicadorFinanciero;
    capital_trabajo:          IndicadorFinanciero;
    endeudamiento:            IndicadorFinanciero;
    deuda_patrimonio:         IndicadorFinanciero;
    roe:                      IndicadorFinanciero;
    roa:                      IndicadorFinanciero;
    concentracion_cxc:        IndicadorFinanciero;
    disponibilidad_inmediata: IndicadorFinanciero;
  };
  hallazgos:        { tipo: "positivo" | "negativo"; texto: string }[];
  recomendaciones:  string[];
  semaforo:         SemaforoFinanciero;
}

// ── RESUMEN ───────────────────────────────────────────────────

export interface ResumenFinanciero {
  periodo: { mes: number; anio: number };
  ingresos: {
    total_acordado:   number;
    total_cobrado:    number;
    total_por_cobrar: number;
    cobrado_completo: number;
    cantidad:         number;
    utilidad_neta:    number;
  };
  egresos: {
    total_egresos: number;
    cantidad:      number;
  };
  por_cobrar: {
    por_cobrar_total: number;
  };
  pasivos: {
    total_por_pagar:    number;
    total_vencido:      number;
    cantidad_pendientes: number;
    cantidad_vencidos:  number;
    posicion_real:      number;
  };
  por_servicio:  { tipo_servicio: TipoServicio; total: number }[];
  por_categoria: { categoria: CategoriaEgreso; total: number }[];
  flujo_mensual: { etiqueta: string; ingresos: number; egresos: number; utilidad: number }[];
}
