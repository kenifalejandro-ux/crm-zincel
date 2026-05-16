/**4️⃣ server/modules/metricas/metricas.controller.ts */

import { Request, Response } from "express";
import { metricasService }   from "./metricas.service";
import { MetricaSchema }     from "../../server/schemas/metricas.schema";

export const metricasController = {

  async crear(req: Request, res: Response) {
    const parsed = MetricaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data = await metricasService.crear(parsed.data, (req as any).usuario.id);
    res.status(201).json(data);
  },

  async listar(req: Request, res: Response) {
    const { empresa, plataforma } = req.query as Record<string, string>;
    const data = await metricasService.listar({ empresa, plataforma });
    res.json(data);
  },

  async porId(req: Request, res: Response) {
    const data = await metricasService.porId(req.params.id);
    if (!data) return res.status(404).json({ error: "No encontrado" });
    res.json(data);
  },

  async actualizar(req: Request, res: Response) {
    const data = await metricasService.actualizar(req.params.id, req.body);
    res.json(data);
  },

  async eliminar(req: Request, res: Response) {
    await metricasService.eliminar(req.params.id);
    res.status(204).send();
  },

  async resumen(req: Request, res: Response) {
    const { empresa } = req.query as { empresa: string };
    if (!empresa) return res.status(400).json({ error: "empresa requerida" });
    const data = await metricasService.resumenPorEmpresa(empresa);
    res.json(data);
  },
};