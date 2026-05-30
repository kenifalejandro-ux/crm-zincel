/**src/server/schemas/prospecto.schema.ts */

import { z } from "zod";

export const crearProspectoSchema = z.object({
  empresa:          z.string().min(1, "La empresa es obligatoria").max(200),
  rubro:            z.string().max(300).optional(),
  tamano_empresa:   z.enum(["1_10","11_50","51_200","201_500","mas_500"]).optional(),
  pagina_web:       z.string().max(300).optional().or(z.literal("")),
  web_activa:       z.boolean().optional(),
  proveedor_web:    z.string().max(150).optional(),
  estado_web:       z.enum(["actualizada","por_actualizar","vencida","en_mantenimiento","sin_informacion"]).optional().nullable(),
  nombre_contacto:  z.string().max(150).optional(),
  cargo:            z.string().max(100).optional(),
  telefono:         z.string().max(30).optional(),
  email_contacto:   z.string().max(150).optional().or(z.literal("")),
  ciudad:           z.string().max(100).optional(),
  region:           z.string().max(100).optional(),
  pais:             z.string().max(100).default("Perú"),
  prioridad:        z.enum(["alta","media","baja"]).default("media"),
  fuente:           z.enum(["base_propia","google_ads","facebook","instagram","tiktok","linkedin","referido","web","llamada_fria","otro"]).optional(),
  estado_lead:      z.enum(["nuevo","por_gestionar","interesado","no_interesado","no_contesta","volver_a_llamar","buzon_de_voz","fuera_de_servicio","numero_equivocado","ya_tiene_proveedor","baja_de_oficio","solicita_informacion","suspension_temporal","perdida"]).default("por_gestionar"),
  clasificacion:    z.enum(["gestionado","por_gestionar","cerrado","descartado"]).default("por_gestionar"),
  estado_venta:     z.enum(["si","no","en_proceso"]).default("no"),
  notas:            z.string().optional(),
  motivo_perdida:         z.enum(["precio_alto","ya_tiene_proveedor","sin_presupuesto","no_le_interesa","tiene_web","no_toma_decision","otro"]).optional().nullable(),
  motivo_perdida_detalle: z.string().max(500).optional().nullable(),
  etapa_pipeline:   z.enum(["nuevo","contactado","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"]).optional(),
  valor_estimado:       z.number().min(0).nullable().optional(),
  moneda_pipeline:      z.enum(["PEN", "USD"]).default("PEN"),
  tipo_cambio_pipeline: z.number().positive().default(1),
});

export const actualizarProspectoSchema = crearProspectoSchema.partial();

export type CrearProspectoInput    = z.infer<typeof crearProspectoSchema>;
export type ActualizarProspectoInput = z.infer<typeof actualizarProspectoSchema>;