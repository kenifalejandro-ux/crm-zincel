/** src/server/schemas/propuesta.schema.ts */

import { z } from "zod";

const SERVICIOS = [
  "desarrollo_web", "wordpress", "diseño_marketing", "redes_sociales",
  "publicidad_digital", "erp", "crm", "otro",
] as const;

const ESTADOS = [
  "enviada", "en_negociacion", "cerrada_ganada", "cerrada_perdida", "vencida",
] as const;

export const crearPropuestaSchema = z.object({
  prospecto_id:    z.string().uuid(),
  servicio:        z.enum(SERVICIOS),
  descripcion:     z.string().min(1, "La descripción es obligatoria").max(300),
  monto_propuesto: z.number().positive("El monto debe ser positivo"),
  monto_cerrado:   z.number().min(0).optional().nullable(),
  moneda:          z.enum(["PEN", "USD"]).default("PEN"),
  tipo_cambio:     z.number().positive().default(1),
  estado:          z.enum(ESTADOS).default("enviada"),
  fecha_propuesta:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_negociacion:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  fecha_cierre:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notas:           z.string().optional(),
});

export const actualizarPropuestaSchema = crearPropuestaSchema
  .omit({ prospecto_id: true })
  .partial();

export type CrearPropuestaInput      = z.infer<typeof crearPropuestaSchema>;
export type ActualizarPropuestaInput = z.infer<typeof actualizarPropuestaSchema>;
