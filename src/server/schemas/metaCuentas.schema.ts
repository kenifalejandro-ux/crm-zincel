import { z } from "zod";

export const MetaCuentaSchema = z.object({
  empresa:       z.string().min(1),
  ad_account_id: z.string().min(1),
  access_token:  z.string().min(1),
  activo:        z.boolean().default(true),
  notas:         z.string().optional(),
});

export type MetaCuentaInput = z.infer<typeof MetaCuentaSchema>;
