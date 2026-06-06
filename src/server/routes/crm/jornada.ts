/**src/server/routes/crm/jornada.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearRegistroJornadaSchema, actualizarRegistroJornadaSchema } from "../../schemas/jornada.schema";
import {
  crearRegistroJornadaService,
  obtenerRegistrosJornadaService,
  resumenJornadaService,
  resumenSemanalJornadaService,
  actualizarRegistroJornadaService,
  eliminarRegistroJornadaService,
} from "../../services/jornada.service";

export const jornadaRouter = Router();
jornadaRouter.use(authMiddleware);

// GET /api/crm/jornada/resumen
jornadaRouter.get("/resumen", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await resumenJornadaService(usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/jornada/semanal
jornadaRouter.get("/semanal", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await resumenSemanalJornadaService(usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/jornada
jornadaRouter.get("/", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { fecha, semana, prospecto_id, categoria, servicio } = req.query as Record<string, string>;
    const data = await obtenerRegistrosJornadaService(usuario.id, { fecha, semana, prospecto_id, categoria, servicio });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/jornada
jornadaRouter.post("/", validate(crearRegistroJornadaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearRegistroJornadaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/jornada/:id
jornadaRouter.put("/:id", validate(actualizarRegistroJornadaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await actualizarRegistroJornadaService(req.params.id, req.body, usuario.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/jornada/:id
jornadaRouter.delete("/:id", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    await eliminarRegistroJornadaService(req.params.id, usuario.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(404).json({ ok: false, message: err.message });
  }
});
