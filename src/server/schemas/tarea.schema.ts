/**src/server/schemas/tarea.schema.ts */

import { z } from "zod";

export const crearTareaSchema = z.object({
  prospecto_id:      z.string().uuid().optional(),
  titulo:            z.string().min(1).max(200),
  descripcion:       z.string().optional(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
});

export const actualizarTareaSchema = crearTareaSchema.partial().extend({
  completada: z.boolean().optional(),
});

export type CrearTareaInput      = z.infer<typeof crearTareaSchema>;
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;
