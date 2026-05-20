/**client/src/types/plantilla.types.ts */

export type CanalPlantilla = "whatsapp" | "correo" | "ambos";

export interface Plantilla {
  id:        string;
  titulo:    string;
  canal:     CanalPlantilla;
  contenido: string;
  creado_en: string;
}
