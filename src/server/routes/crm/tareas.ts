/**src/server/routes/crm/tareas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearTareaSchema, actualizarTareaSchema } from "../../schemas/tarea.schema";
import {
  crearTareaService,
  obtenerTareasService,
  completarTareaService,
  actualizarTareaService,
  eliminarTareaService,
  resumenTareasPendientesService,
} from "../../services/tarea.service";

export const tareasRouter = Router();
tareasRouter.use(authMiddleware);

// GET /api/crm/tareas/resumen
tareasRouter.get("/resumen", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await resumenTareasPendientesService(usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/tareas
tareasRouter.get("/", async (req, res) => {
  try {
    const usuario         = (req as any).usuario;
    const { prospecto_id, solo_pendientes } = req.query as Record<string, string>;
    const data = await obtenerTareasService({
      prospecto_id,
      solo_pendientes: solo_pendientes === "true",
      usuario_id: usuario.id,
    });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/tareas
tareasRouter.post("/", validate(crearTareaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearTareaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/tareas/:id/completar
tareasRouter.patch("/:id/completar", async (req, res) => {
  try {
    const data = await completarTareaService(req.params.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/tareas/:id
tareasRouter.put("/:id", validate(actualizarTareaSchema), async (req, res) => {
  try {
    const data = await actualizarTareaService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/tareas/:id
tareasRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarTareaService(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
