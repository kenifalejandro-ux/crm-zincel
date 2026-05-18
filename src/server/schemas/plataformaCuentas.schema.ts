import { z } from "zod";

export const PlataformaCuentaSchema = z.object({
  empresa:       z.string().min(1),
  plataforma:    z.enum(["meta", "tiktok", "google"]),
  account_id:    z.string().min(1),
  access_token:  z.string().min(1),
  activo:         z.boolean().default(true),
  notas:          z.string().optional(),
  token_vence_en: z.string().optional().nullable(),
});

export type PlataformaCuentaInput = z.infer<typeof PlataformaCuentaSchema>;
