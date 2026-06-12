/** src/server/routes/crm/competidores.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { pool } from "../../config/database";
import {
  lookupPaginaFacebook,
  agregarCompetidor,
  agregarCompetidorManual,
  actualizarSeguidores,
  syncCompetidores,
  listarCompetidores,
  historiaCompetidor,
} from "../../services/competidores.service";

export const competidoresRouter = Router();
competidoresRouter.use(authMiddleware);

// GET /api/crm/competidores?empresa=X
competidoresRouter.get("/", async (req, res) => {
  const { empresa } = req.query as { empresa?: string };
  if (!empresa) return res.json({ data: [] });
  try {
    const rows = await listarCompetidores(empresa);
    res.json({ data: rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/competidores/lookup?url=X&empresa=Y  — busca una página por URL o nombre exacto
competidoresRouter.get("/lookup", async (req, res) => {
  const { url, empresa } = req.query as { url: string; empresa: string };
  if (!url || !empresa) return res.status(400).json({ message: "url y empresa requeridos" });
  try {
    const pagina = await lookupPaginaFacebook(url, empresa);
    res.json({ data: pagina });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/competidores — agregar competidor por page_id
competidoresRouter.post("/", async (req, res) => {
  const { empresa, pagina_id } = req.body;
  if (!empresa || !pagina_id) return res.status(400).json({ message: "empresa y pagina_id requeridos" });
  try {
    const competidor = await agregarCompetidor(empresa, pagina_id);
    res.json({ ok: true, data: competidor });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/competidores/manual — agregar sin API de Meta
competidoresRouter.post("/manual", async (req, res) => {
  const { empresa, nombre, seguidores, url_pagina } = req.body;
  if (!empresa || !nombre || seguidores === undefined) {
    return res.status(400).json({ message: "empresa, nombre y seguidores son requeridos" });
  }
  try {
    const c = await agregarCompetidorManual(empresa, nombre, Number(seguidores), url_pagina);
    res.json({ ok: true, data: c });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/crm/competidores/:id/seguidores — registrar nuevo conteo
competidoresRouter.patch("/:id/seguidores", async (req, res) => {
  const { id } = req.params;
  const { seguidores } = req.body;
  if (seguidores === undefined) return res.status(400).json({ message: "seguidores requerido" });
  try {
    await actualizarSeguidores(id, Number(seguidores));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/crm/competidores/:id
competidoresRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE competidores SET activo = false WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/competidores/sync
competidoresRouter.post("/sync", async (req, res) => {
  const { empresa } = req.body;
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const resultado = await syncCompetidores(empresa);
    res.json({ ok: true, total: resultado.total, sincronizados: resultado.ok, errores: resultado.errores });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/competidores/:id/historia?dias=90
competidoresRouter.get("/:id/historia", async (req, res) => {
  const { id } = req.params;
  const dias = parseInt((req.query.dias as string) ?? "90");
  try {
    const rows = await historiaCompetidor(id, dias);
    res.json({ data: rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
