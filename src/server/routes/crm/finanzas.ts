/**src/server/routes/crm/finanzas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  crearIngresoSchema, actualizarIngresoSchema,
  crearEgresoSchema,  actualizarEgresoSchema,
  crearPrestamoSchema, actualizarPrestamoSchema,
} from "../../schemas/finanzas.schema";
import {
  crearIngresoService, obtenerIngresosService, actualizarIngresoService,
  eliminarIngresoService, eliminarIngresosMasivoService,
  crearEgresoService,  obtenerEgresosService,  actualizarEgresoService,
  eliminarEgresoService, eliminarEgresosMasivoService,
  crearPrestamoService, obtenerPrestamosService, actualizarPrestamoService,
  eliminarPrestamoService, eliminarPrestamosMasivoService,
  resumenFinancieroService, analisisFinancieroService,
} from "../../services/finanzas.service";

export const finanzasRouter = Router();
finanzasRouter.use(authMiddleware);

// ── RESUMEN ────────────────────────────────────────────────────

// GET /api/crm/finanzas/resumen?mes=5&anio=2026
finanzasRouter.get("/resumen", async (req, res) => {
  try {
    const mes         = req.query.mes         ? Number(req.query.mes)         : undefined;
    const anio        = req.query.anio        ? Number(req.query.anio)        : undefined;
    const tipo_cambio = req.query.tipo_cambio ? Number(req.query.tipo_cambio) : 1;
    const data = await resumenFinancieroService({ mes, anio, tipo_cambio });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── ANÁLISIS FINANCIERO ────────────────────────────────────────

// GET /api/crm/finanzas/analisis
finanzasRouter.get("/analisis", async (req, res) => {
  try {
    const data = await analisisFinancieroService();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── INGRESOS ───────────────────────────────────────────────────

// GET /api/crm/finanzas/ingresos
finanzasRouter.get("/ingresos", async (req, res) => {
  try {
    const data = await obtenerIngresosService({
      desde:  req.query.desde  as string,
      hasta:  req.query.hasta  as string,
      estado: req.query.estado as string,
      mes:    req.query.mes  ? Number(req.query.mes)  : undefined,
      anio:   req.query.anio ? Number(req.query.anio) : undefined,
    });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/finanzas/ingresos
finanzasRouter.post("/ingresos", validate(crearIngresoSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearIngresoService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/finanzas/ingresos/:id
finanzasRouter.put("/ingresos/:id", validate(actualizarIngresoSchema), async (req, res) => {
  try {
    const data = await actualizarIngresoService(req.params.id, req.body);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/ingresos/:id
finanzasRouter.delete("/ingresos/:id", async (req, res) => {
  try {
    const data = await eliminarIngresoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/ingresos (masivo)
finanzasRouter.delete("/ingresos", async (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const eliminados = await eliminarIngresosMasivoService(ids);
    res.status(200).json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── EGRESOS ────────────────────────────────────────────────────

// GET /api/crm/finanzas/egresos
finanzasRouter.get("/egresos", async (req, res) => {
  try {
    const data = await obtenerEgresosService({
      categoria: req.query.categoria as string,
      estado:    req.query.estado    as string,
      mes:       req.query.mes  ? Number(req.query.mes)  : undefined,
      anio:      req.query.anio ? Number(req.query.anio) : undefined,
    });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/finanzas/egresos
finanzasRouter.post("/egresos", validate(crearEgresoSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearEgresoService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/finanzas/egresos/:id
finanzasRouter.put("/egresos/:id", validate(actualizarEgresoSchema), async (req, res) => {
  try {
    const data = await actualizarEgresoService(req.params.id, req.body);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/egresos/:id
finanzasRouter.delete("/egresos/:id", async (req, res) => {
  try {
    const data = await eliminarEgresoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/egresos (masivo)
finanzasRouter.delete("/egresos", async (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const eliminados = await eliminarEgresosMasivoService(ids);
    res.status(200).json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PRÉSTAMOS ──────────────────────────────────────────────────

// GET /api/crm/finanzas/prestamos
finanzasRouter.get("/prestamos", async (req, res) => {
  try {
    const data = await obtenerPrestamosService({ estado: req.query.estado as string });
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/finanzas/prestamos
finanzasRouter.post("/prestamos", validate(crearPrestamoSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearPrestamoService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/finanzas/prestamos/:id
finanzasRouter.put("/prestamos/:id", validate(actualizarPrestamoSchema), async (req, res) => {
  try {
    const data = await actualizarPrestamoService(req.params.id, req.body);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/prestamos/:id
finanzasRouter.delete("/prestamos/:id", async (req, res) => {
  try {
    const data = await eliminarPrestamoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/finanzas/prestamos (masivo)
finanzasRouter.delete("/prestamos", async (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const eliminados = await eliminarPrestamosMasivoService(ids);
    res.status(200).json({ ok: true, eliminados });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
