/**src/server/routes/crm/prospectos.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearProspectoSchema, actualizarProspectoSchema } from "../../schemas/prospecto.schema";
import {
  crearProspectoService,
  obtenerProspectosService,
  obtenerProspectoPorIdService,
  actualizarProspectoService,
  eliminarProspectoService,
  importarProspectosService,
  eliminarProspectosMasivoService,
  motivosPerdidaService,
  getPipelineService,
  actualizarEtapaPipelineService,
  funnelPipelineService,
  analisisRegionService,
  scoreLeadsService,
  getScoreHistoryService,
} from "../../services/prospecto.service";

export const prospectosRouter = Router();

prospectosRouter.use(authMiddleware);

// GET /api/crm/prospectos/scores
prospectosRouter.get("/scores", async (req, res) => {
  try {
    const data = await scoreLeadsService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/:id/score-history
prospectosRouter.get("/:id/score-history", async (req, res) => {
  try {
    const data = await getScoreHistoryService(req.params.id);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/funnel
prospectosRouter.get("/funnel", async (req, res) => {
  try {
    const data = await funnelPipelineService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/por-region
prospectosRouter.get("/por-region", async (req, res) => {
  try {
    const data = await analisisRegionService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/motivos-perdida
prospectosRouter.get("/motivos-perdida", async (req, res) => {
  try {
    const data = await motivosPerdidaService();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/pipeline
prospectosRouter.get("/pipeline", async (req, res) => {
  try {
    const data = await getPipelineService();
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/crm/prospectos/:id/etapa
prospectosRouter.patch("/:id/etapa", async (req, res) => {
  try {
    const { etapa, valor_estimado } = req.body;
    if (!etapa) return res.status(400).json({ ok: false, message: "etapa requerida" });
    const data = await actualizarEtapaPipelineService(req.params.id, etapa, valor_estimado);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos
prospectosRouter.get("/", async (req, res) => {
  try {
    const filtros = {
      estado_lead:   req.query.estado_lead as string,
      clasificacion: req.query.clasificacion as string,
      prioridad:     req.query.prioridad as string,
      fuente:        req.query.fuente as string,
      busqueda:      req.query.busqueda as string,
      pagina:        req.query.pagina ? parseInt(req.query.pagina as string) : 1,//paginacion
      limite:        req.query.limite ? parseInt(req.query.limite as string) : 50,//paginacion
    };
    const result = await obtenerProspectosService(filtros);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/prospectos/:id
prospectosRouter.get("/:id", async (req, res) => {
  try {
    const prospecto = await obtenerProspectoPorIdService(req.params.id);
    if (!prospecto) return res.status(404).json({ ok: false, message: "Prospecto no encontrado" });
    res.status(200).json({ ok: true, data: prospecto });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/prospectos
prospectosRouter.post("/", validate(crearProspectoSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearProspectoService(req.body, usuario.id);
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/prospectos/:id
prospectosRouter.put("/:id", validate(actualizarProspectoSchema), async (req, res) => {
  try {
    const data = await actualizarProspectoService(req.params.id, req.body);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});


// DELETE /api/crm/prospectos/masivo
prospectosRouter.delete("/masivo", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "IDs inválidos",
      });
    }

    const eliminados = await eliminarProspectosMasivoService(ids);

    res.status(200).json({
      ok: true,
      eliminados,
    });

  } catch (err: any) {
    res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
});
// DELETE /api/crm/prospectos/:id
prospectosRouter.delete("/:id", async (req, res) => {
  try {
    const data = await eliminarProspectoService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/prospectos/importar
prospectosRouter.post("/importar", async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { prospectos } = req.body;
    if (!Array.isArray(prospectos) || prospectos.length === 0) {
      return res.status(400).json({ ok: false, message: "No hay prospectos para importar" });
    }
    const result = await importarProspectosService(prospectos, usuario.id);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});