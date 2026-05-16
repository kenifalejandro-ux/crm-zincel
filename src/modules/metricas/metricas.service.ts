/**server/modules/metricas/metricas.service.ts */

import { metricasRepository } from "./metricas.repository";
import { MetricaInput }   from "../../server/schemas/metricas.schema";

export const metricasService = {

  crear(data: MetricaInput, userId: string) {
    return metricasRepository.crear({ ...data, creado_por: userId });
  },

  listar(filtros: { empresa?: string; plataforma?: string; sub_plataforma?: string }) { // ✅ agregado sub_plataforma
    return metricasRepository.listar(filtros);
  },
  
  porId(id: string) {
    return metricasRepository.porId(id);
  },

  actualizar(id: string, data: Partial<MetricaInput>) {
    return metricasRepository.actualizar(id, data);
  },

  eliminar(id: string) {
    return metricasRepository.eliminar(id);
  },

  resumenPorEmpresa(empresa: string) {
    return metricasRepository.resumenPorEmpresa(empresa);
  },
};