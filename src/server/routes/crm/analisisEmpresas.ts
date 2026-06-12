/** src/server/routes/crm/analisisEmpresas.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  listarEmpresasService, crearEmpresaService, actualizarEmpresaService, eliminarEmpresaService,
  listarPeriodosService, crearPeriodoService, actualizarPeriodoService, eliminarPeriodoService,
  analisisEmpresaService,
} from "../../services/analisisEmpresas.service";

export const analisisEmpresasRouter = Router();
analisisEmpresasRouter.use(authMiddleware);

// ── EMPRESAS ──────────────────────────────────────────────────

analisisEmpresasRouter.get("/", async (req, res) => {
  try {
    const data = await listarEmpresasService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.post("/", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearEmpresaService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.put("/:id", async (req, res) => {
  try {
    const data = await actualizarEmpresaService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.delete("/:id", async (req, res) => {
  try {
    const data = await eliminarEmpresaService(req.params.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PERÍODOS ──────────────────────────────────────────────────

analisisEmpresasRouter.get("/:empresaId/periodos", async (req, res) => {
  try {
    const data = await listarPeriodosService(req.params.empresaId);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.post("/:empresaId/periodos", async (req, res) => {
  try {
    const data = await crearPeriodoService(req.params.empresaId, req.body);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.put("/periodos/:id", async (req, res) => {
  try {
    const data = await actualizarPeriodoService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

analisisEmpresasRouter.delete("/periodos/:id", async (req, res) => {
  try {
    const data = await eliminarPeriodoService(req.params.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── ANÁLISIS ──────────────────────────────────────────────────

// GET /api/crm/empresas-analisis/:empresaId/analisis?periodo_id=...
analisisEmpresasRouter.get("/:empresaId/analisis", async (req, res) => {
  try {
    const periodoId = req.query.periodo_id as string;
    if (!periodoId) return res.status(400).json({ ok: false, message: "Falta periodo_id" });
    const data = await analisisEmpresaService(req.params.empresaId, periodoId);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
