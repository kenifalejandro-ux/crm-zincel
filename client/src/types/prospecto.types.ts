/**client/src/types/prospecto.types.ts*/

/**client/src/types/prospecto.types.ts*/

export type EstadoLead =
  | "nuevo"
  | "por_gestionar"
  | "interesado"
  | "no_interesado"
  | "no_contesta"
  | "volver_a_llamar"
  | "ocupado_en_reunion"
  | "prometio_llamar"
  | "buzon_de_voz"
  | "fuera_de_servicio"
  | "numero_equivocado"
  | "ya_tiene_proveedor"
  | "baja_de_oficio"
  | "solicita_informacion"
  | "suspension_temporal"
  | "no_habido"
  | "perdida"
  | "venta_ganada";

export type CanalContacto = "llamada" | "whatsapp" | "correo" | "linkedin" | "instagram" | "facebook";
export type FuenteLead = "facebook" | "instagram" | "tiktok" | "linkedin" | "referido" | "web" | "llamada_fria" | "otro";
export type CalidadLead = "sin_calificar" | "calificado" | "no_calificado";
export type RedSocial = "facebook" | "instagram" | "tiktok" | "linkedin" | "ninguna";
export type TamanoEmpresa = "1_10" | "11_50" | "51_200" | "201_500" | "mas_500";
export type Prioridad = "alta" | "media" | "baja";
export type ClasificacionLead = "gestionado" | "por_gestionar" | "cerrado" | "descartado";
export type EstadoVenta = "si" | "no" | "en_proceso";
export type EtapaPipeline = "nuevo" | "contactado" | "interesado" | "propuesta_enviada" | "negociacion" | "cerrado_ganado" | "perdido";
export type EstadoWeb = "actualizada" | "por_actualizar" | "vencida" | "en_mantenimiento" | "sin_informacion";
export type ModalidadReunion = "presencial" | "virtual" | "google_meet" | "zoom";
export type EstadoReunion = "agendada" | "en_proceso" | "cerrada" | "descartada";

export interface Llamada {
  id?:               string;
  prospecto_id?:     string;
  fecha?:            string;
  canal?:            CanalContacto;
  contestada?:       boolean;
  duracion_minutos?: number;
  resultado?:        string;
  notas?:            string;
  devolvio_llamada?: boolean;
  intentos?:         number;
  primer_contacto?:  string;
}

export interface Brochure {
  id?:          string;
  prospecto_id?: string;
  canal?:       CanalContacto;
  fecha_envio?: string;
  enviado?:     boolean;
  notas?:       string;
}

export interface Reunion {
  id?:          string;
  prospecto_id?: string;
  titulo?:      string;
  fecha_hora?:  string;
  modalidad?:   ModalidadReunion;
  estado?:      EstadoReunion;
  enlace?:      string;
  notas?:       string;
  ingreso?:     boolean;
}

export interface Propuesta {
  id:              string;
  prospecto_id:    string;
  servicio:        string;
  descripcion:     string;
  monto_propuesto: number;
  monto_cerrado?:  number | null;
  moneda:          string;
  tipo_cambio:     number;
  estado:          string;
  fecha_propuesta: string;
  fecha_cierre?:   string | null;
  notas?:          string;
  creado_en:       string;
  actualizado_en:  string;
}

export interface ContactoSecundario {
  id:        string;
  nombre:    string;
  cargo?:    string;
  telefono?: string;
  email?:    string;
}

export interface Prospecto {
  id:               string;
  empresa:          string;
  actividad_economica?: string;
  sector?:              string;
  perfil_empresa?:      string;
  cantidad_trabajadores?: number;
  redes_sociales?:      RedSocial[];
  tamano_empresa?:  TamanoEmpresa;
  pagina_web?:      string;
  web_activa?:      boolean;
  proveedor_web?:   string;
  estado_web?:      EstadoWeb | null;
  nombre_contacto?: string;
  cargo?:           string;
  telefono?:        string;
  email_contacto?:  string;
  ciudad?:          string;
  region?:          string;
  pais:             string;
  prioridad:        Prioridad;
  fuente?:          FuenteLead;
  calidad_lead?:    CalidadLead;
  campana_origen?:  string | null;
  estado_lead:      EstadoLead;
  clasificacion:    ClasificacionLead;
  estado_venta:     EstadoVenta;
  notas?:           string;
  etapa_pipeline:          EtapaPipeline;
  valor_estimado?:         number | null;
  valor_pipeline?:         number;
  moneda?:                 string | null;
  servicio_propuesta?:     string | null;
  propuestas_list?:        Array<{ id: string; servicio: string; monto: number; moneda: string; estado: string }> | null;
  fecha_primer_contacto?:  string | null;
  fecha_cierre?:           string | null;
  creado_en:               string;
  actualizado_en:          string;
  llamadas?:        Llamada[];
  reuniones?:       Reunion[];
  brochures?:       Brochure[];
  propuestas?:      Propuesta[];
  contactos?:       ContactoSecundario[];
}

export interface FiltrosProspecto {
  estado_lead?:   string;
  clasificacion?: string;
  prioridad?:     string;
  fuente?:        string;
  busqueda?:      string;
  pagina?:        number;
  limite?:        number;
}

export interface PaginacionProspecto {
  data:   Prospecto[];
  total:  number;
  pagina: number;
  limite: number;
}