/** src/server/routes/crm/inicio.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { getResumenInicioService } from "../../services/inicio.service";

export const inicioRouter = Router();
inicioRouter.use(authMiddleware);

// GET /api/crm/inicio
inicioRouter.get("/", async (req, res) => {
  try {
    const usuarioId = (req as any).usuario?.id;
    if (!usuarioId) return res.status(401).json({ ok: false, message: "No autorizado" });
    const data = await getResumenInicioService(usuarioId);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
