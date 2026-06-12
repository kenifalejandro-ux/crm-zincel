/** src/types/metricas.types.ts */

export type Plataforma    = "meta" | "google" | "tiktok";
export type SubPlataforma = "facebook" | "instagram" | "audience_network";

export interface Metrica {
  id:                 string;
  empresa:            string;
  campana_nombre:     string;
  plataforma:         Plataforma;
  sub_plataforma?:    SubPlataforma | null;
  periodo_inicio:     string;
  periodo_fin:        string;

  // Alcance
  impresiones:        number;
  alcance:            number;
  clics:              number;
  ctr:                number;

  // Costo
  gasto:              number;
  cpc:                number;
  cpm:                number;
  cpa:                number;

  // Ingresos
  ingresos:           number;
  costo_total:        number;

  // Resultados
  conversiones:       number;
  leads:              number;
  mensajes:           number;
  roas:               number;
  roi:                number;

  // Comunidad
  seguidores_ganados: number;
  perfil_visitas:     number;
  frecuencia:         number;

  // Engagement
  interacciones:      number;
  me_gusta:           number;
  comentarios:        number;
  compartidos:        number;
  guardados:          number;
  tasa_engagement:    number;
  costo_por_mensaje:  number;

  // Video
  reproducciones:     number;
  tasa_reproduccion:  number;

  notas?:                 string;
  platform_campaign_id?:  string | null;
  objetivo?:              "venta" | "branding" | "comunidad";
  proyecto?:              string | null;
  proyectos:              string[];
  creado_en:              string;

  // Ventas atribuidas (calculado en join)
  ventas_count?:          number;
  ingresos_atribuidos?:   number;
  mejor_confianza?:       "confirmada" | "probable" | "sin_datos" | null;
}

export interface ResumenPlataforma {
  plataforma:           Plataforma;
  sub_plataforma?:      string | null;
  campanas:             number;
  total_gasto:          number;
  total_leads:          number;
  total_conversiones:   number;
  total_seguidores:     number;
  total_reproducciones: number;
  roas_promedio:        number;
  cpa_promedio:         number;
  engagement_promedio:  number;
}

export interface FiltrosMetrica {
  empresa?:        string;
  plataforma?:     Plataforma | "";
  sub_plataforma?: SubPlataforma | "";
  desde?:          string;
  hasta?:          string;
  proyecto?:       string;
}

export type FormMetrica = {
  empresa:            string;
  campana_nombre:     string;
  plataforma:         Plataforma;
  sub_plataforma:     string;
  periodo_inicio:     string;
  periodo_fin:        string;

  // Alcance
  impresiones:        string;
  alcance:            string;
  clics:              string;
  ctr:                string;       // ← calculado

  // Costo
  gasto:              string;
  cpc:                string;       // ← calculado
  cpm:                string;       // ← calculado
  cpa:                string;       // ← calculado

  // Ingresos
  ingresos:           string;
  costo_total:        string;

  // Resultados
  conversiones:       string;
  leads:              string;
  mensajes:           string;
  roas:               string;       // ← calculado
  roi:                string;       // ← calculado
  costo_por_lead:     string;       // ← calculado

  // Comunidad
  seguidores_ganados: string;
  perfil_visitas:     string;
  frecuencia:         string;       // ← calculado

  // Engagement
  interacciones:      string;
  me_gusta:           string;
  comentarios:        string;
  compartidos:        string;
  guardados:          string;
  tasa_engagement:    string;
  costo_por_mensaje:  string;       // ← calculado

  // Video
  reproducciones:     string;
  tasa_reproduccion:  string;

  notas:              string;
  objetivo:           "venta" | "branding" | "comunidad";
  proyectos:          string[];
};