/** src/server/routes/crm/metaCuentas.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { validate } from "../../middleware/validate";
import { MetaCuentaSchema } from "../../schemas/metaCuentas.schema";
import {
  listarMetaCuentas,
  crearMetaCuenta,
  actualizarMetaCuenta,
  eliminarMetaCuenta,
} from "../../services/metaCuentas.service";

export const metaCuentasRouter = Router();
metaCuentasRouter.use(authMiddleware);

metaCuentasRouter.get("/", async (_req, res) => {
  try {
    const data = await listarMetaCuentas();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metaCuentasRouter.post("/", validate(MetaCuentaSchema), async (req, res) => {
  try {
    const data = await crearMetaCuenta(req.validatedBody);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    const isDuplicate = err.message?.includes("unique") || err.code === "23505";
    res.status(isDuplicate ? 409 : 500).json({
      ok: false,
      message: isDuplicate ? `Ya existe una cuenta para la empresa "${req.body.empresa}"` : err.message,
    });
  }
});

metaCuentasRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarMetaCuenta(req.params.id, req.body);
    if (!data) return res.status(404).json({ ok: false, message: "Cuenta no encontrada" });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

metaCuentasRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarMetaCuenta(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
