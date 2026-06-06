import { z } from "zod";

export const MetaCuentaSchema = z.object({
  empresa:       z.string().min(1),
  ad_account_id: z.string().min(1),
  access_token:  z.string().min(1),
  activo:        z.boolean().default(true),
  notas:         z.string().optional(),
});

export const MetaProyeccionSchema = z.object({
  empresa:             z.string().min(1),
  cpl_umbral:          z.number().positive().nullable().optional(),
  fase_campana:        z.enum(["aprendizaje", "calibracion", "escalado"]).default("aprendizaje"),
  vendedor_email:      z.string().email().nullable().optional(),
  vendedor_whatsapp:   z.string().max(30).nullable().optional(),
});

export type MetaCuentaInput    = z.infer<typeof MetaCuentaSchema>;
export type MetaProyeccionInput = z.infer<typeof MetaProyeccionSchema>;
