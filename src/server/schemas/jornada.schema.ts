/**src/server/schemas/jornada.schema.ts */

import { z } from "zod";

export const ACTIVIDADES_JORNADA = [
  "propuesta_cotizacion",
  "desarrollo_web",
  "diseno_wireframe",
  "mejoras_crm",
  "reunion_interna",
  "administracion",
  "capacitacion",
  "marketing_contenido",
  "otro",
] as const;

export const SERVICIOS_JORNADA = [
  "desarrollo_web",
  "wordpress",
  "diseño_marketing",
  "redes_sociales",
  "publicidad_digital",
  "erp",
  "crm",
  "otro",
] as const;

export type ActividadJornada = typeof ACTIVIDADES_JORNADA[number];
export type ServicioJornada  = typeof SERVICIOS_JORNADA[number];

export const crearRegistroJornadaSchema = z.object({
  fecha:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  servicio:     z.enum(SERVICIOS_JORNADA),
  categoria:    z.enum(ACTIVIDADES_JORNADA),
  descripcion:  z.string().max(500).optional(),
  horas:        z.number().positive().max(24),
  prospecto_id: z.string().uuid().optional().nullable(),
});

export const actualizarRegistroJornadaSchema = crearRegistroJornadaSchema.partial();

export type CrearRegistroJornadaInput      = z.infer<typeof crearRegistroJornadaSchema>;
export type ActualizarRegistroJornadaInput = z.infer<typeof actualizarRegistroJornadaSchema>;
