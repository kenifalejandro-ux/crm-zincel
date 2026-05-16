/** src/modules/metricas/metricas.routes.ts */

import { Router }             from "express";
import { metricasController } from "./metricas.controller";

const router = Router();

router.get   ("/",        metricasController.listar);
router.post  ("/",        metricasController.crear);
router.get   ("/resumen", metricasController.resumen);
router.get   ("/:id",     metricasController.porId);
router.put   ("/:id",     metricasController.actualizar);
router.delete("/:id",     metricasController.eliminar);

export default router;