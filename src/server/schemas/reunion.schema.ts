/**src/server/schemas/reunion.schema.ts */

import { z } from "zod";

export const crearReunionSchema = z.object({
  prospecto_id: z.string().uuid("ID de prospecto inválido"),
  titulo:       z.string().min(1, "El título es obligatorio").max(200),
// ✅ Acepta el formato que envía el input datetime-local
  fecha_hora: z.string().min(1, "La fecha es obligatoria"),  
  modalidad:    z.enum(["zoom","google_meet","presencial","teams","whatsapp_video","llamada"]).default("google_meet"),
  enlace:       z.string().url("URL inválida").max(500).optional().or(z.literal("")),
  estado:       z.enum(["programada","realizada","cancelada","reprogramada","en_proceso"]).default("programada"),
  notas:        z.string().optional(),
  hora_fin:     z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
});

export const actualizarReunionSchema = crearReunionSchema.partial();

export type CrearReunionInput      = z.infer<typeof crearReunionSchema>;
export type ActualizarReunionInput = z.infer<typeof actualizarReunionSchema>;