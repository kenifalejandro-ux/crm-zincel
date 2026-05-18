/** src/server/routes/crm/plataformaCuentas.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { validate } from "../../middleware/validate";
import { PlataformaCuentaSchema } from "../../schemas/plataformaCuentas.schema";
import {
  listarPlataformaCuentas,
  crearPlataformaCuenta,
  actualizarPlataformaCuenta,
  eliminarPlataformaCuenta,
  listarEmpresasConCuentas,
  obtenerPlataformasDeEmpresa,
} from "../../services/plataformaCuentas.service";

export const plataformaCuentasRouter = Router();
plataformaCuentasRouter.use(authMiddleware);

// GET /api/crm/plataforma-cuentas — lista todas las cuentas
plataformaCuentasRouter.get("/", async (_req, res) => {
  try {
    res.json({ ok: true, data: await listarPlataformaCuentas() });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/plataforma-cuentas/empresas — empresas con al menos una cuenta
plataformaCuentasRouter.get("/empresas", async (_req, res) => {
  try {
    res.json({ ok: true, data: await listarEmpresasConCuentas() });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/plataforma-cuentas/empresa/:empresa/plataformas
plataformaCuentasRouter.get("/empresa/:empresa/plataformas", async (req, res) => {
  try {
    const plataformas = await obtenerPlataformasDeEmpresa(req.params.empresa);
    res.json({ ok: true, data: plataformas });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/plataforma-cuentas
plataformaCuentasRouter.post("/", validate(PlataformaCuentaSchema), async (req, res) => {
  try {
    const data = await crearPlataformaCuenta(req.validatedBody);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    const isDuplicate = err.code === "23505";
    res.status(isDuplicate ? 409 : 500).json({
      ok: false,
      message: isDuplicate
        ? `Ya existe una cuenta de ${req.body.plataforma} para "${req.body.empresa}"`
        : err.message,
    });
  }
});

// PUT /api/crm/plataforma-cuentas/:id
plataformaCuentasRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarPlataformaCuenta(req.params.id, req.body);
    if (!data) return res.status(404).json({ ok: false, message: "Cuenta no encontrada" });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/plataforma-cuentas/:id
plataformaCuentasRouter.delete("/:id", async (req, res) => {
  try {
    await eliminarPlataformaCuenta(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
