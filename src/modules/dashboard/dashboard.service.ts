/** src/modules/dashboard/dashboard.service.ts */

import { DashboardRepository } from "./dashboard.repository";

export const DashboardService = {

  async getFullDashboardData(periodo: string = "mes", mes?: number, anio?: number) {

    let whereFecha = "";

    switch (periodo) {
      case "hoy":
        whereFecha = `DATE(created_at) = CURRENT_DATE`;
        break;
      case "semana":
        whereFecha = `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        break;
      case "mes":
        if (mes && anio) {
          whereFecha = `EXTRACT(MONTH FROM created_at) = ${mes} AND EXTRACT(YEAR FROM created_at) = ${anio}`;
        } else {
          whereFecha = `DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
        }
        break;
      case "anio":
        whereFecha = `DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)`;
        break;
      default:
        whereFecha = "1=1";
    }

    const [
      kpis,
      llamadasPorCanal,
      llamadasPorMes,
      reunionesPorEstado,
      prospectosPorCiudad,
      prospectosPorEstado,
    ] = await Promise.all([
      DashboardRepository.getKPIs(whereFecha),
      DashboardRepository.llamadasPorCanal(whereFecha),
      DashboardRepository.llamadasPorMes(whereFecha),
      DashboardRepository.reunionesPorEstado(whereFecha),
      DashboardRepository.prospectosPorCiudad(whereFecha),
      DashboardRepository.prospectosPorEstado(whereFecha),
    ]);

    return {
      llamadas: {
        total_llamadas:          Number(kpis.total_llamadas || 0),
        llamadas_contestadas:    Number(kpis.llamadas_contestadas || 0),
        llamadas_no_contestadas: Number(kpis.llamadas_no_contestadas || 0),
        llamadas_hoy:            Number(kpis.total_llamadas || 0),
        llamadas_mes:            Number(kpis.total_llamadas || 0),
      },
      llamadas_por_canal: llamadasPorCanal,
      llamadas_por_mes:   llamadasPorMes,

      brochures: {
        total_brochures:    Number(kpis.total_brochures || 0),
        brochures_correo:   Number(kpis.brochures_correo || 0),
        brochures_whatsapp: Number(kpis.brochures_whatsapp || 0),
        brochures_hoy:      Number(kpis.total_brochures || 0),
        brochures_mes:      Number(kpis.total_brochures || 0),
      },

      reuniones: {
        total_reuniones:       Number(kpis.total_reuniones || 0),
        reuniones_programadas: Number(kpis.reuniones_programadas || 0),
        reuniones_realizadas:  Number(kpis.reuniones_realizadas || 0),
        reuniones_canceladas:  Number(kpis.reuniones_canceladas || 0),
        reuniones_descartadas: Number(kpis.reuniones_descartadas || 0),
        reuniones_hoy:         Number(kpis.total_reuniones || 0),
        reuniones_mes:         Number(kpis.total_reuniones || 0),
      },

      prospectos: {
        total_prospectos:          Number(kpis.total_prospectos || 0),
        prospectos_interesados:    Number(kpis.prospectos_interesados || 0),
        prospectos_no_interesados: Number(kpis.prospectos_no_interesados || 0),
        prospectos_no_contesta:    Number(kpis.prospectos_no_contesta || 0),
        prospectos_volver_llamar:  Number(kpis.prospectos_volver_llamar || 0),
        prospectos_buzon:          Number(kpis.prospectos_buzon || 0),
        prospectos_tiene_proveedor:Number(kpis.prospectos_tiene_proveedor || 0),
        prospectos_con_web:        Number(kpis.prospectos_con_web || 0),
        prospectos_sin_web:        Number(kpis.prospectos_sin_web || 0),
        prospectos_hoy:            Number(kpis.total_prospectos || 0),
        prospectos_mes:            Number(kpis.total_prospectos || 0),
      },

      ventas: {
        cerradas:   Number(kpis.ventas_cerradas || 0),
        en_proceso: Number(kpis.ventas_en_proceso || 0),
        no:         Number(kpis.ventas_no || 0),
      },

      tasa_conversion: Number(kpis.tasa_conversion || 0),

      prospectos_por_ciudad: prospectosPorCiudad,
      prospectos_por_estado: prospectosPorEstado,
      reuniones_por_estado:  reunionesPorEstado,

      finanzas: {
        ingresos_mes:  Number(kpis.ingresos || 0),
        ingresos_anio: Number(kpis.ingresos || 0),
      },
    };
  },

  getKPIs:             (w?: string) => DashboardRepository.getKPIs(w),
  llamadasPorCanal:    (w?: string) => DashboardRepository.llamadasPorCanal(w),
  llamadasPorMes:      (w?: string) => DashboardRepository.llamadasPorMes(w),
  reunionesPorEstado:  (w?: string) => DashboardRepository.reunionesPorEstado(w),
  prospectosPorCiudad: (w?: string) => DashboardRepository.prospectosPorCiudad(w),
  prospectosPorEstado: (w?: string) => DashboardRepository.prospectosPorEstado(w),
};