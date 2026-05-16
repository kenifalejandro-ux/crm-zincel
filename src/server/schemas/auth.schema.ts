/**src/server/schemas/auth.schema.ts */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "El email es obligatorio" })
    .email("Email inválido")
    .toLowerCase(),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(6, "Mínimo 6 caracteres"),
  recaptchaToken: z
    .string({ required_error: "Token de reCaptcha requerido" })
    .min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;