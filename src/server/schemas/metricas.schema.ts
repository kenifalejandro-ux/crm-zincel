/** server/schemas/metricas.schema.ts */

import { z } from "zod";

export const MetricaSchema = z.object({
  empresa:            z.string().min(1),
  campana_nombre:     z.string().min(1),
  plataforma:         z.enum(["meta", "google", "tiktok"]),
  sub_plataforma:     z.enum(["facebook", "instagram", "audience_network"]).nullable().optional(),
  periodo_inicio:     z.string(),
  periodo_fin:        z.string(),

  // Alcance
  impresiones:        z.number().default(0),
  alcance:            z.number().default(0),
  clics:              z.number().default(0),
  ctr:                z.number().default(0),

  // Costo
  gasto:              z.number().default(0),
  cpc:                z.number().default(0),
  cpm:                z.number().default(0),
  cpa:                z.number().default(0),

  // Ingresos ← nuevos
  ingresos:           z.number().default(0),
  costo_total:        z.number().default(0),

  // Resultados
  conversiones:       z.number().default(0),
  leads:              z.number().default(0),
  mensajes:           z.number().default(0),
  roas:               z.number().default(0),
  roi:                z.number().default(0),
  costo_por_lead:     z.number().default(0),

  // Comunidad
  seguidores_ganados: z.number().default(0),
  perfil_visitas:     z.number().default(0),
  frecuencia:         z.number().default(0), // ← nuevo

  // Engagement
  interacciones:      z.number().default(0),
  me_gusta:           z.number().default(0),
  comentarios:        z.number().default(0),
  compartidos:        z.number().default(0),
  guardados:          z.number().default(0),
  tasa_engagement:    z.number().default(0),
  costo_por_mensaje:  z.number().default(0),

  // Video
  reproducciones:     z.number().default(0),
  tasa_reproduccion:  z.number().default(0),

  notas:              z.string().optional(),
});

export type MetricaInput = z.infer<typeof MetricaSchema>;