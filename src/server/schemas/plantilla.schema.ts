/**src/server/schemas/plantilla.schema.ts */

import { z } from "zod";

export const crearPlantillaSchema = z.object({
  titulo:    z.string().min(1).max(100),
  canal:     z.enum(["whatsapp", "correo", "ambos"]),
  contenido: z.string().min(1).max(2000),
});

export const actualizarPlantillaSchema = crearPlantillaSchema.partial();

export type CrearPlantillaInput     = z.infer<typeof crearPlantillaSchema>;
export type ActualizarPlantillaInput = z.infer<typeof actualizarPlantillaSchema>;
