/** client/src/types/resultado.types.ts */

export type ConfianzaAtribucion = "confirmada" | "probable" | "sin_datos";

export interface Resultado {
  id:                     string;
  empresa:                string;
  metrica_id:             string | null;
  metrica_ids?:           string[];
  campana_nombre:         string;
  proyecto:               string | null;
  monto:                  string | number;
  costo_venta:            string | number;
  fecha_venta:            string;
  confianza_atribucion:   ConfianzaAtribucion;
  prospecto_id:           string | null;
  prospecto_nombre:       string | null;
  notas:                  string | null;
  created_at:             string;
}

export interface ResultadoInput {
  empresa:                string;
  metrica_ids:            string[];         // vacío = sin atribución
  campana_nombre:         string;
  proyecto?:              string;
  monto:                  number;
  costo_venta:            number;
  fecha_venta:            string;
  confianza_atribucion:   ConfianzaAtribucion;
  prospecto_id?:          string;
  notas?:                 string;
}

export interface ResumenCampana {
  total_ventas:    number;
  total_ingresos:  number;
  ticket_promedio: number;
}
