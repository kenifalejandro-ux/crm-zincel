/**src/server/routes/crm/plantillas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearPlantillaSchema, actualizarPlantillaSchema } from "../../schemas/plantilla.schema";
import {
  obtenerPlantillasService,
  crearPlantillaService,
  actualizarPlantillaService,
  eliminarPlantillaService,
} from "../../services/plantilla.service";

export const plantillasRouter = Router();
plantillasRouter.use(authMiddleware);

plantillasRouter.get("/", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await obtenerPlantillasService(usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

plantillasRouter.post("/", validate(crearPlantillaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearPlantillaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

plantillasRouter.put("/:id", validate(actualizarPlantillaSchema), async (req, res) => {
  try {
    const data = await actualizarPlantillaService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});

plantillasRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarPlantillaService(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});
