/** src/server/routes/crm/propuestas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearPropuestaSchema, actualizarPropuestaSchema } from "../../schemas/propuesta.schema";
import {
  crearPropuestaService,
  obtenerPropuestasService,
  actualizarPropuestaService,
  eliminarPropuestaService,
} from "../../services/propuesta.service";

export const propuestasRouter = Router();

propuestasRouter.use(authMiddleware);

// GET /api/crm/propuestas?prospecto_id=xxx
propuestasRouter.get("/", async (req, res) => {
  try {
    const { prospecto_id } = req.query;
    if (!prospecto_id || typeof prospecto_id !== "string") {
      return res.status(400).json({ ok: false, message: "prospecto_id requerido" });
    }
    const data = await obtenerPropuestasService(prospecto_id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/propuestas
propuestasRouter.post("/", validate(crearPropuestaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearPropuestaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/propuestas/:id
propuestasRouter.put("/:id", validate(actualizarPropuestaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await actualizarPropuestaService(req.params.id, req.body, usuario.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    const status = err.message === "Propuesta no encontrada" ? 404 : 500;
    res.status(status).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/propuestas/:id
propuestasRouter.delete("/:id", async (req, res) => {
  try {
    const data = await eliminarPropuestaService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    const status = err.message === "Propuesta no encontrada" ? 404 : 500;
    res.status(status).json({ ok: false, message: err.message });
  }
});
