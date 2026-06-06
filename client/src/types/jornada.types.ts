/**client/src/types/jornada.types.ts */

export const ACTIVIDADES_JORNADA = [
  "propuesta_cotizacion",
  "desarrollo_web",
  "diseno_wireframe",
  "mejoras_crm",
  "reunion_interna",
  "administracion",
  "capacitacion",
  "marketing_contenido",
  "otro",
] as const;

export const SERVICIOS_JORNADA = [
  "desarrollo_web",
  "wordpress",
  "diseño_marketing",
  "redes_sociales",
  "publicidad_digital",
  "erp",
  "crm",
  "otro",
] as const;

export type ActividadJornada = typeof ACTIVIDADES_JORNADA[number];
export type ServicioJornada  = typeof SERVICIOS_JORNADA[number];

export const ACTIVIDAD_LABELS: Record<ActividadJornada, string> = {
  propuesta_cotizacion: "Propuesta / Cotización",
  desarrollo_web:       "Programación / Desarrollo",
  diseno_wireframe:     "Diseño / Wireframe",
  mejoras_crm:          "Mejoras internas",
  reunion_interna:      "Reunión interna",
  administracion:       "Administración",
  capacitacion:         "Capacitación",
  marketing_contenido:  "Marketing / Contenido",
  otro:                 "Otro",
};

export const SERVICIO_LABELS: Record<ServicioJornada, string> = {
  desarrollo_web:    "Desarrollo Web",
  wordpress:         "WordPress",
  "diseño_marketing": "Diseño & Marketing",
  redes_sociales:    "Redes Sociales",
  publicidad_digital: "Publicidad Digital",
  erp:               "ERP",
  crm:               "CRM",
  otro:              "Otro",
};

export const ACTIVIDAD_COLORS: Record<ActividadJornada, string> = {
  propuesta_cotizacion: "#f59e0b",
  desarrollo_web:       "#3b82f6",
  diseno_wireframe:     "#8b5cf6",
  mejoras_crm:          "#10b981",
  reunion_interna:      "#6366f1",
  administracion:       "#64748b",
  capacitacion:         "#0ea5e9",
  marketing_contenido:  "#ec4899",
  otro:                 "#9ca3af",
};

export const SERVICIO_COLORS: Record<ServicioJornada, string> = {
  desarrollo_web:     "#3b82f6",
  wordpress:          "#0ea5e9",
  "diseño_marketing": "#ec4899",
  redes_sociales:     "#8b5cf6",
  publicidad_digital: "#f59e0b",
  erp:                "#10b981",
  crm:                "#6366f1",
  otro:               "#9ca3af",
};

export interface RegistroJornada {
  id:           string;
  usuario_id:   string;
  fecha:        string;
  servicio:     ServicioJornada;
  categoria:    ActividadJornada;
  descripcion?: string;
  horas:        number;
  prospecto_id?: string | null;
  empresa?:     string | null;
  created_at:   string;
}

export interface ResumenJornada {
  horas_hoy:     number;
  horas_semana:  number;
  horas_mes:     number;
  por_categoria: { categoria: ActividadJornada; horas: number }[];
  por_servicio:  { servicio: ServicioJornada;  horas: number }[];
}

export interface RegistroSemanal {
  fecha:     string;
  servicio:  ServicioJornada;
  categoria: ActividadJornada;
  horas:     number;
}
