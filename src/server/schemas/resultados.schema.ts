/** server/schemas/resultados.schema.ts */

import { z } from "zod";

export const ResultadoSchema = z.object({
  empresa:        z.string().min(1),
  metrica_id:     z.string().uuid(),
  campana_nombre: z.string().min(1),
  proyecto:       z.string().nullable().optional(),
  monto:          z.number().min(0),
  costo_venta:    z.number().min(0).optional().default(0),
  fecha_venta:    z.string(),
  prospecto_id:   z.string().uuid().nullable().optional(),
  notas:          z.string().nullable().optional(),
});

export type ResultadoInput = z.infer<typeof ResultadoSchema>;
