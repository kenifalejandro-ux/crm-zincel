/**client/src/types/llamada.types.ts*/

export interface Llamada {
  id:               string;
  prospecto_id:     string;
  fecha:            string;
  canal:            string;
  contestada:       boolean;
  duracion_minutos: number;
  resultado?:       string;
  notas?:           string;
  creado_por?:      string;
  creado_en:        string;
}

export interface CrearLlamadaPayload {
  prospecto_id:     string;
  fecha?:           string;
  canal:            string;
  contestada:       boolean;
  duracion_minutos: number;
  resultado?:       string;
  notas?:           string;
}