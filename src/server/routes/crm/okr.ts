/** src/server/routes/crm/okr.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  listOkrsService,
  createOkrService,
  updateOkrService,
  deleteOkrService,
  addKeyResultService,
  updateKeyResultService,
  deleteKeyResultService,
} from "../../services/okr.service";

export const okrRouter = Router();
okrRouter.use(authMiddleware);

// GET /api/crm/okr
okrRouter.get("/", async (req, res) => {
  try {
    const data = await listOkrsService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/okr
okrRouter.post("/", async (req, res) => {
  try {
    const { titulo, descripcion, trimestre, anio } = req.body;
    if (!titulo || !trimestre || !anio) {
      return res.status(400).json({ ok: false, message: "titulo, trimestre y anio son requeridos" });
    }
    const data = await createOkrService({ titulo, descripcion, trimestre: Number(trimestre), anio: Number(anio) });
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/okr/:id
okrRouter.put("/:id", async (req, res) => {
  try {
    const { titulo, descripcion, trimestre, anio } = req.body;
    const data = await updateOkrService(req.params.id, {
      titulo,
      descripcion,
      trimestre: trimestre != null ? Number(trimestre) : undefined,
      anio: anio != null ? Number(anio) : undefined,
    });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/okr/:id
okrRouter.delete("/:id", async (req, res) => {
  try {
    await deleteOkrService(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/okr/:id/kr
okrRouter.post("/:id/kr", async (req, res) => {
  try {
    const { titulo, tipo_metrica, valor_objetivo, valor_actual } = req.body;
    if (!titulo || !tipo_metrica || !valor_objetivo) {
      return res.status(400).json({ ok: false, message: "titulo, tipo_metrica y valor_objetivo son requeridos" });
    }
    const data = await addKeyResultService(req.params.id, {
      titulo,
      tipo_metrica,
      valor_objetivo: Number(valor_objetivo),
      valor_actual: valor_actual != null ? Number(valor_actual) : 0,
    });
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/okr/:okrId/kr/:krId
okrRouter.put("/:okrId/kr/:krId", async (req, res) => {
  try {
    const { titulo, valor_objetivo, valor_actual } = req.body;
    const data = await updateKeyResultService(req.params.krId, {
      titulo,
      valor_objetivo: valor_objetivo != null ? Number(valor_objetivo) : undefined,
      valor_actual: valor_actual != null ? Number(valor_actual) : undefined,
    });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/okr/:okrId/kr/:krId
okrRouter.delete("/:okrId/kr/:krId", async (req, res) => {
  try {
    await deleteKeyResultService(req.params.krId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
