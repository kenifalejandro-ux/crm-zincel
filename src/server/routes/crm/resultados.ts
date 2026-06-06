/** server/routes/crm/resultados.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { validate } from "../../middleware/validate";
import { ResultadoSchema } from "../../schemas/resultados.schema";
import {
  crearResultadoService,
  listarResultadosService,
  actualizarResultadoService,
  eliminarResultadoService,
  resumenPorCampanaService,
} from "../../services/resultados.service";

export const resultadosRouter = Router();
resultadosRouter.use(authMiddleware);

resultadosRouter.get("/", async (req, res) => {
  try {
    const { empresa, metrica_id } = req.query as Record<string, string>;
    const data = await listarResultadosService({ empresa, metrica_id });
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

resultadosRouter.get("/resumen/:metrica_id", async (req, res) => {
  try {
    const data = await resumenPorCampanaService(req.params.metrica_id);
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

resultadosRouter.post("/", validate(ResultadoSchema), async (req, res) => {
  try {
    const data = await crearResultadoService(req.validatedBody as any);
    res.status(201).json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

resultadosRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarResultadoService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});

resultadosRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarResultadoService(req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ ok: false, message: e.message }); }
});
