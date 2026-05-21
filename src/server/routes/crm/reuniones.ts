/**src/server/routes/crm/reuniones.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearReunionSchema, actualizarReunionSchema } from "../../schemas/reunion.schema";
import {
  crearReunionService,
  obtenerReunionesService,
  actualizarReunionService,
  marcarEmailEnviadoService,
  resumenReunionesService,
  eliminarReunionesMasivoService,
  estadisticasReunionesPorPeriodoService,
  kpisReunionesFiltradoService,
} from "../../services/reuniones.service";
import { invalidarCacheCRM } from "../../config/cache";

export const reunionesRouter = Router();

reunionesRouter.use(authMiddleware);

// GET /api/crm/reuniones
reunionesRouter.get("/", async (req, res) => {
  try {
    const filtros = {
      estado:        req.query.estado as string,
      prospecto_id:  req.query.prospecto_id as string,
      desde:         req.query.desde as string,
      hasta:         req.query.hasta as string,
    };
    const data = await obtenerReunionesService(filtros);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/reuniones
reunionesRouter.post("/", validate(crearReunionSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearReunionService(req.body, usuario.id);
    void invalidarCacheCRM();
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/reuniones/:id
reunionesRouter.put("/:id", validate(actualizarReunionSchema), async (req, res) => {
  try {
    const data = await actualizarReunionService(req.params.id, req.body);
    void invalidarCacheCRM();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/reuniones/:id/email-enviado
reunionesRouter.patch("/:id/email-enviado", async (req, res) => {
  try {
    const data = await marcarEmailEnviadoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/reuniones/resumen
reunionesRouter.get("/resumen", async (_req, res) => {
  try {
    const data = await resumenReunionesService();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/reuniones/estadisticas
reunionesRouter.get("/estadisticas", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, granularidad } = req.query;
    const data = await estadisticasReunionesPorPeriodoService(
      fecha_inicio as string | undefined,
      fecha_fin    as string | undefined,
      ((granularidad as string) === "hora" ? "hora" : (granularidad as string) === "mes" ? "mes" : "dia")
    );
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/reuniones/kpis
reunionesRouter.get("/kpis", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const data = await kpisReunionesFiltradoService({
      fecha_inicio: fecha_inicio as string | undefined,
      fecha_fin:    fecha_fin    as string | undefined,
    });
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/reuniones/reuniones/:id
// ✅ Agrega esto en reuniones.ts
reunionesRouter.delete("/", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ ok: false, message: "ids requeridos" });
    }
    const data = await eliminarReunionesMasivoService(ids);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});