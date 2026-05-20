/**client/src/types/tarea.types.ts */

export interface Tarea {
  id:                string;
  prospecto_id?:     string;
  titulo:            string;
  descripcion?:      string;
  fecha_vencimiento: string;
  completada:        boolean;
  completada_en?:    string;
  creado_por?:       string;
  creado_en:         string;
  empresa?:          string;
  nombre_contacto?:  string;
}

export interface ResumenTareas {
  vencidas:  number;
  hoy:       number;
  proximas:  number;
  total:     number;
}
