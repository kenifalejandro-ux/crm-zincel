/** src/server/routes/crm/configuracion.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  getTipoCambioService,
  guardarTipoCambioService,
  actualizarTipoCambioDesdeAPIService,
} from "../../services/configuracion.service";

export const configuracionRouter = Router();
configuracionRouter.use(authMiddleware);

// GET /api/crm/configuracion/tipo-cambio
configuracionRouter.get("/tipo-cambio", async (_req, res) => {
  try {
    const data = await getTipoCambioService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/configuracion/tipo-cambio  { valor: 3.75 }
configuracionRouter.put("/tipo-cambio", async (req, res) => {
  try {
    const valor = Number(req.body.valor);
    if (!valor || valor <= 0) return res.status(400).json({ ok: false, message: "Valor inválido" });
    const data = await guardarTipoCambioService(valor);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/configuracion/tipo-cambio/actualizar
configuracionRouter.post("/tipo-cambio/actualizar", async (_req, res) => {
  try {
    const data = await actualizarTipoCambioDesdeAPIService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(502).json({ ok: false, message: "No se pudo conectar con la API de tipo de cambio" });
  }
});
