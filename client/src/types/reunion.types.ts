/**client/src/types/reunion.types.ts*/

export type EstadoReunion = "programada" | "realizada" | "cancelada" | "reprogramada" | "en_proceso";
export type ModalidadReunion = "zoom" | "google_meet" | "presencial" | "teams" | "whatsapp_video" | "llamada";

export interface Reunion {
  id:                string;
  prospecto_id:      string;
  titulo:            string;
  fecha_hora:        string;
  hora_fin?:         string;
  duracion_minutos?: number;
  modalidad:         ModalidadReunion;
  enlace?:           string;
  estado:            EstadoReunion;
  notas?:            string;
  email_enviado:     boolean;
  empresa?:          string;
  nombre_contacto?:  string;
  email_contacto?:   string;
  creado_en:         string;
  actualizado_en:    string;
}

export interface CrearReunionPayload {
  prospecto_id: string;
  titulo:       string;
  fecha_hora:   string;
  hora_fin?:    string;
  modalidad:    ModalidadReunion;
  enlace?:      string;
  estado?:      EstadoReunion;
  notas?:       string;
}

export interface ResumenReuniones {
  programadas: number;
  realizadas: number;
  canceladas: number;
  reprogramadas: number;
  en_proceso: number;
}