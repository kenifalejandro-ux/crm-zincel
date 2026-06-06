/** src/server/routes/crm/metaCuentas.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { validate } from "../../middleware/validate";
import { MetaCuentaSchema, MetaProyeccionSchema } from "../../schemas/metaCuentas.schema";
import {
  listarMetaCuentas,
  crearMetaCuenta,
  actualizarMetaCuenta,
  eliminarMetaCuenta,
  obtenerProyeccionConfig,
  guardarProyeccionConfig,
} from "../../services/metaCuentas.service";

export const metaCuentasRouter = Router();
metaCuentasRouter.use(authMiddleware);

// Rutas específicas ANTES de las rutas con parámetro /:id
// GET /api/crm/meta-cuentas/proyeccion?empresa=X
metaCuentasRouter.get("/proyeccion", async (req, res) => {
  const empresa = req.query.empresa as string;
  if (!empresa) return res.status(400).json({ ok: false, message: "Parámetro empresa requerido" });
  try {
    const data = await obtenerProyeccionConfig(empresa);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/meta-cuentas/proyeccion
metaCuentasRouter.put("/proyeccion", async (req, res) => {
  const parsed = MetaProyeccionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, errors: parsed.error.flatten() });
  try {
    const data = await guardarProyeccionConfig(parsed.data);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

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
