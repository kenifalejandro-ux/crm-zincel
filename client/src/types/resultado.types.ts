/** client/src/types/resultado.types.ts */

export interface Resultado {
  id:               string;
  empresa:          string;
  metrica_id:       string;
  campana_nombre:   string;
  proyecto:         string | null;
  monto:            string | number;
  costo_venta:      string | number;
  fecha_venta:      string;
  prospecto_id:     string | null;
  prospecto_nombre: string | null;
  notas:            string | null;
  created_at:       string;
}

export interface ResultadoInput {
  empresa:        string;
  metrica_id:     string;
  campana_nombre: string;
  proyecto?:      string;
  monto:          number;
  costo_venta:    number;
  fecha_venta:    string;
  prospecto_id?:  string;
  notas?:         string;
}

export interface ResumenCampana {
  total_ventas:    number;
  total_ingresos:  number;
  ticket_promedio: number;
}
