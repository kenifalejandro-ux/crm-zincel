/**client/src/types/llamada.types.ts*/

export interface Llamada {
  id:                string;
  prospecto_id:      string;
  fecha:             string;
  hora_fin?:         string;
  canal:             string;
  contestada:        boolean;
  resultado?:        string;
  motivo_no_interes?: string;
  accion_acordada?:  string;
  notas?:            string;
  creado_por?:       string;
  creado_en:         string;
}

export interface CrearLlamadaPayload {
  prospecto_id:      string;
  fecha?:            string;
  hora_fin?:         string;
  canal:             string;
  contestada:        boolean;
  resultado?:        string;
  motivo_no_interes?: string;
  accion_acordada?:  string;
  notas?:            string;
}
