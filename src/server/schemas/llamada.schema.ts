/**src/server/schemas/llamada.schema.ts */

import { z } from "zod";

export const crearLlamadaSchema = z.object({
  prospecto_id:      z.string().uuid("ID de prospecto inválido"),
  fecha:             z.string().datetime().optional(),
  hora_fin:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
  canal:             z.enum(["llamada","whatsapp","correo","linkedin","instagram","facebook"]).default("llamada"),
  contestada:        z.boolean().default(false),
  resultado:         z.enum(["interesado","no_interesado","no_contesta","volver_a_llamar","buzon_de_voz","fuera_de_servicio","numero_equivocado","ya_tiene_proveedor"]).optional(),
  motivo_no_interes: z.enum(["precio","sin_presupuesto","ya_tiene_proveedor","no_necesita","no_decide","mala_experiencia","otro"]).optional(),
  notas:             z.string().optional(),
});

export type CrearLlamadaInput = z.infer<typeof crearLlamadaSchema>;