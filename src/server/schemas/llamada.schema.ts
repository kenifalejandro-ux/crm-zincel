/**src/server/schemas/llamada.schema.ts */

import { z } from "zod";

export const crearLlamadaSchema = z.object({
  prospecto_id:      z.string().uuid("ID de prospecto inválido"),
  fecha:             z.string().datetime({ offset: true }).optional(),
  hora_fin:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
  canal:             z.enum(["llamada","whatsapp","correo","linkedin","instagram","facebook"]).default("llamada"),
  contestada:        z.boolean().default(false),
  resultado:         z.enum(["interesado","solicita_informacion","no_interesado","no_contesta","volver_a_llamar","ocupado_en_reunion","prometio_llamar","buzon_de_voz","fuera_de_servicio","numero_equivocado","ya_tiene_proveedor","baja_de_oficio","suspension_temporal","no_habido"]).optional(),
  motivo_no_interes: z.enum(["precio_alto","sin_presupuesto","no_le_interesa","tiene_web","no_toma_decision","otro"]).optional(),
  accion_acordada:   z.enum(["enviar_brochure","agendar_reunion","cotizar","volver_llamar","ninguna"]).optional(),
  notas:             z.string().optional(),
});

export type CrearLlamadaInput = z.infer<typeof crearLlamadaSchema>;