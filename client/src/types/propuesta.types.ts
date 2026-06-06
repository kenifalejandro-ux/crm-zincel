/** client/src/types/propuesta.types.ts */

export type ServicioPropuesta =
  | "desarrollo_web"
  | "wordpress"
  | "diseño_marketing"
  | "redes_sociales"
  | "erp"
  | "crm"
  | "otro";

export type EstadoPropuesta =
  | "enviada"
  | "en_negociacion"
  | "cerrada_ganada"
  | "cerrada_perdida"
  | "vencida";

export type Moneda = "PEN" | "USD";

export const MOTIVOS_CIERRE_PERDIDO = [
  "Precio muy alto",
  "Eligió a la competencia",
  "Sin presupuesto aprobado",
  "Decisor no aprobó",
  "Proyecto cancelado",
  "Propuesta vencida sin respuesta",
  "No respondió más",
  "Otro motivo",
] as const;

export type MotivoCierrePerdido = typeof MOTIVOS_CIERRE_PERDIDO[number];

export interface Propuesta {
  id:              string;
  prospecto_id:    string;
  servicio:        ServicioPropuesta;
  descripcion:     string;
  subcategoria?:   string | null;
  monto_propuesto: number;
  monto_cerrado?:  number | null;
  moneda:          Moneda;
  tipo_cambio:     number;
  estado:                EstadoPropuesta;
  fecha_propuesta:       string;
  fecha_negociacion?:    string | null;
  fecha_cierre?:         string | null;
  notas?:                string;
  notas_negociacion?:    string | null;
  notas_cierre?:         string | null;
  motivo_cierre_perdido?: string | null;
  creado_en:       string;
  actualizado_en:  string;
}

export interface FormPropuesta {
  servicio:              ServicioPropuesta;
  descripcion:           string;
  subcategoria:          string;
  monto_propuesto:       string;
  monto_cerrado:         string;
  moneda:                Moneda;
  tipo_cambio:           string;
  estado:                EstadoPropuesta;
  fecha_propuesta:       string;
  fecha_negociacion:     string;
  fecha_cierre:          string;
  notas:                 string;
  notas_negociacion:     string;
  notas_cierre:          string;
  motivo_cierre_perdido: string;
}

export const LABEL_SERVICIO: Record<ServicioPropuesta, string> = {
  desarrollo_web:     "Desarrollo Web",
  wordpress:          "WordPress",
  "diseño_marketing": "Diseño & Marketing",
  redes_sociales:     "Redes Sociales",
  erp:                "ERP",
  crm:                "CRM",
  otro:               "Otro",
};

export const LABEL_ESTADO: Record<EstadoPropuesta, string> = {
  enviada:          "Enviada",
  en_negociacion:   "En negociación",
  cerrada_ganada:   "Cerrada ganada",
  cerrada_perdida:  "Cerrada perdida",
  vencida:          "Vencida",
};

export const COLOR_ESTADO: Record<EstadoPropuesta, string> = {
  enviada:         "bg-blue-100 text-blue-700",
  en_negociacion:  "bg-yellow-100 text-yellow-700",
  cerrada_ganada:  "bg-green-100 text-green-700",
  cerrada_perdida: "bg-red-100 text-red-700",
  vencida:         "bg-zinc-100 text-zinc-500",
};
