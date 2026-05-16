/** client/src/types/propuesta.types.ts */

export type ServicioPropuesta =
  | "desarrollo_web"
  | "wordpress"
  | "diseño_marketing"
  | "redes_sociales"
  | "publicidad_digital"
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

export interface Propuesta {
  id:              string;
  prospecto_id:    string;
  servicio:        ServicioPropuesta;
  descripcion:     string;
  monto_propuesto: number;
  monto_cerrado?:  number | null;
  moneda:          Moneda;
  tipo_cambio:     number;
  estado:          EstadoPropuesta;
  fecha_propuesta: string;
  fecha_cierre?:   string | null;
  notas?:          string;
  creado_en:       string;
  actualizado_en:  string;
}

export interface FormPropuesta {
  servicio:        ServicioPropuesta;
  descripcion:     string;
  monto_propuesto: string;
  monto_cerrado:   string;
  moneda:          Moneda;
  tipo_cambio:     string;
  estado:          EstadoPropuesta;
  fecha_propuesta: string;
  fecha_cierre:    string;
  notas:           string;
}

export const LABEL_SERVICIO: Record<ServicioPropuesta, string> = {
  desarrollo_web:     "Desarrollo Web",
  wordpress:          "WordPress",
  "diseño_marketing": "Diseño & Marketing",
  redes_sociales:     "Redes Sociales",
  publicidad_digital: "Publicidad Digital",
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
