/**src/server/services/dashboard.service.ts */

import { pool } from "../config/database";

export async function metricasDashboardService(
  periodo: string = "mes",
  mes?: number,
  anio?: number
) {
  const buildFiltro = (columna: string) => {
    if (periodo === 'mes' && mes && anio) {
      return `EXTRACT(MONTH FROM ${columna}) = ${mes} AND EXTRACT(YEAR FROM ${columna}) = ${anio}`;
    }
    switch (periodo) {
      case "hoy":
        return `${columna}::date = CURRENT_DATE`;
      case "semana":
        return `${columna} >= CURRENT_DATE - INTERVAL '7 days'`;
      case "mes":
        return `${columna} >= CURRENT_DATE - INTERVAL '30 days'`;
      case "trimestre":
        return `${columna} >= CURRENT_DATE - INTERVAL '90 days'`;
      case "anio":
        return `${columna} >= CURRENT_DATE - INTERVAL '365 days'`;
      case "todo":
        return `1=1`;
      default:
        return `${columna} >= CURRENT_DATE - INTERVAL '30 days'`;
    }
  };

  const filtroLlamadas   = buildFiltro("fecha");
  const filtroBrochures  = buildFiltro("fecha_envio");
  const filtroReuniones  = buildFiltro("fecha_hora");
  const filtroProspectos = buildFiltro("creado_en");
  const filtroIngresos   = buildFiltro("fecha");

  try {
    const [
      llamadasResult,
      llamadasPorCanalResult,
      brochuresResult,
      brochuresPorCanalResult,
      reunionesResult,
      prospectosResult,
      prospectosPorCiudadResult,
      prospectosPorEstadoResult,
      finanzasResult,
    ] = await Promise.all([

      pool.query(`
        SELECT
          COUNT(*)::int                                              AS total_llamadas,
          COUNT(*) FILTER (WHERE contestada = true)::int            AS llamadas_contestadas,
          COUNT(*) FILTER (WHERE contestada = false)::int           AS llamadas_no_contestadas
        FROM llamadas
        WHERE ${filtroLlamadas}
      `).catch(() => ({
        rows: [{ total_llamadas: 0, llamadas_contestadas: 0, llamadas_no_contestadas: 0 }]
      })),

      pool.query(`
        SELECT canal, COUNT(*)::int AS cantidad
        FROM llamadas
        WHERE ${filtroLlamadas}
        GROUP BY canal
        ORDER BY cantidad DESC
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT
          COUNT(*)::int                                              AS total_brochures,
          COUNT(*) FILTER (WHERE canal = 'correo')::int             AS brochures_correo,
          COUNT(*) FILTER (WHERE canal = 'whatsapp')::int           AS brochures_whatsapp
        FROM brochures
        WHERE ${filtroBrochures}
      `).catch(() => ({
        rows: [{ total_brochures: 0, brochures_correo: 0, brochures_whatsapp: 0 }]
      })),

      pool.query(`
        SELECT canal, COUNT(*)::int AS cantidad
        FROM brochures
        WHERE ${filtroBrochures}
        GROUP BY canal
        ORDER BY cantidad DESC
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT
          COUNT(*)::int                                                       AS total_reuniones,
          COUNT(*) FILTER (WHERE estado = 'programada')::int                 AS reuniones_programadas,
          COUNT(*) FILTER (WHERE estado = 'realizada')::int                  AS reuniones_realizadas,
          COUNT(*) FILTER (WHERE estado = 'cancelada')::int                  AS reuniones_canceladas,
          COUNT(*) FILTER (WHERE estado = 'reprogramada')::int               AS reuniones_reprogramadas
        FROM reuniones
        WHERE ${filtroReuniones}
      `).catch(() => ({
        rows: [{ total_reuniones: 0, reuniones_programadas: 0, reuniones_realizadas: 0, reuniones_canceladas: 0, reuniones_descartadas: 0 }]
      })),

      pool.query(`
        SELECT
          COUNT(*)::int                                                                 AS total_prospectos,
          COUNT(*) FILTER (WHERE estado_lead = 'interesado')::int                      AS prospectos_interesados,
          COUNT(*) FILTER (WHERE estado_lead = 'no_interesado')::int                   AS prospectos_no_interesados,
          COUNT(*) FILTER (WHERE estado_lead = 'no_contesta')::int                     AS prospectos_no_contesta,
          COUNT(*) FILTER (WHERE estado_lead = 'volver_a_llamar')::int                 AS prospectos_volver_llamar,
          COUNT(*) FILTER (WHERE estado_lead = 'buzon_de_voz')::int                    AS prospectos_buzon,
          COUNT(*) FILTER (WHERE estado_lead = 'ya_tiene_proveedor')::int              AS prospectos_tiene_proveedor,
          COUNT(*) FILTER (WHERE web_activa = true)::int                               AS prospectos_con_web,
          COUNT(*) FILTER (WHERE web_activa = false)::int                              AS prospectos_sin_web,
          COUNT(*) FILTER (WHERE estado_venta = 'si')::int                             AS ventas_cerradas,
          COUNT(*) FILTER (WHERE estado_venta = 'en_proceso')::int                     AS ventas_en_proceso,
          COUNT(*) FILTER (WHERE estado_venta = 'no')::int                             AS ventas_no,
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
              COUNT(*) FILTER (WHERE estado_lead = 'interesado')::numeric * 100 /
              COUNT(*)::numeric, 1
            )
          END AS tasa_conversion
        FROM prospectos
        WHERE ${filtroProspectos}
      `).catch(() => ({
        rows: [{
          total_prospectos: 0, prospectos_interesados: 0, prospectos_no_interesados: 0,
          prospectos_no_contesta: 0, prospectos_volver_llamar: 0, prospectos_buzon: 0,
          prospectos_tiene_proveedor: 0, prospectos_con_web: 0, prospectos_sin_web: 0,
          ventas_cerradas: 0, ventas_en_proceso: 0, ventas_no: 0, tasa_conversion: 0,
        }]
      })),

      pool.query(`
        SELECT
          COALESCE(ciudad, 'Sin ciudad') AS ciudad,
          COUNT(*)::int AS total
        FROM prospectos
        WHERE ${filtroProspectos}
        GROUP BY ciudad
        ORDER BY total DESC
        LIMIT 10
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT estado_lead, COUNT(*)::int AS total
        FROM prospectos
        WHERE ${filtroProspectos}
        GROUP BY estado_lead
        ORDER BY total DESC
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT COALESCE(SUM(monto_total), 0)::numeric AS ingresos_mes
        FROM ingresos
        WHERE ${filtroIngresos}
      `).catch(() => ({
        rows: [{ ingresos_mes: 0 }]
      })),
    ]);

    const ll = llamadasResult.rows[0];
    const br = brochuresResult.rows[0];
    const re = reunionesResult.rows[0];
    const pr = prospectosResult.rows[0];
    const fi = finanzasResult.rows[0];

    return {
      llamadas: {
        total_llamadas:          ll.total_llamadas,
        llamadas_contestadas:    ll.llamadas_contestadas,
        llamadas_no_contestadas: ll.llamadas_no_contestadas,
        llamadas_hoy:            ll.total_llamadas,
        llamadas_mes:            ll.total_llamadas,
      },
      llamadas_por_canal:   llamadasPorCanalResult.rows,
      brochures_por_canal:  brochuresPorCanalResult.rows,

      brochures: {
        total_brochures:    br.total_brochures,
        brochures_correo:   br.brochures_correo,
        brochures_whatsapp: br.brochures_whatsapp,
        brochures_hoy:      br.total_brochures,
        brochures_mes:      br.total_brochures,
      },

      reuniones: {
        total_reuniones:       re.total_reuniones,
        reuniones_programadas: re.reuniones_programadas,
        reuniones_realizadas:  re.reuniones_realizadas,
        reuniones_canceladas:   re.reuniones_canceladas,
        reuniones_descartadas:  0,
        reuniones_reprogramadas: re.reuniones_reprogramadas,
        reuniones_hoy:         re.total_reuniones,
        reuniones_mes:         re.total_reuniones,
      },

      prospectos: {
        total_prospectos:           pr.total_prospectos,
        prospectos_interesados:     pr.prospectos_interesados,
        prospectos_no_interesados:  pr.prospectos_no_interesados,
        prospectos_no_contesta:     pr.prospectos_no_contesta,
        prospectos_volver_llamar:   pr.prospectos_volver_llamar,
        prospectos_buzon:           pr.prospectos_buzon,
        prospectos_tiene_proveedor: pr.prospectos_tiene_proveedor,
        prospectos_con_web:         pr.prospectos_con_web,
        prospectos_sin_web:         pr.prospectos_sin_web,
        prospectos_hoy:             pr.total_prospectos,
        prospectos_mes:             pr.total_prospectos,
      },

      ventas: {
        cerradas:   pr.ventas_cerradas,
        en_proceso: pr.ventas_en_proceso,
        no:         pr.ventas_no,
      },

      tasa_conversion: Number(pr.tasa_conversion),

      prospectos_por_ciudad: prospectosPorCiudadResult.rows,
      prospectos_por_estado: prospectosPorEstadoResult.rows,

      finanzas: {
        ingresos_mes:  Number(fi.ingresos_mes),
        ingresos_anio: Number(fi.ingresos_mes),
      },
    };

  } catch (error) {
    console.error('Error general en metricasDashboardService:', error);
    return {
      llamadas:              { total_llamadas: 0, llamadas_contestadas: 0, llamadas_no_contestadas: 0, llamadas_hoy: 0, llamadas_mes: 0 },
      llamadas_por_canal:    [],
      brochures_por_canal:   [],
      brochures:             { total_brochures: 0, brochures_correo: 0, brochures_whatsapp: 0, brochures_hoy: 0, brochures_mes: 0 },
      reuniones:             { total_reuniones: 0, reuniones_programadas: 0, reuniones_realizadas: 0, reuniones_canceladas: 0, reuniones_descartadas: 0, reuniones_reprogramadas: 0, reuniones_hoy: 0, reuniones_mes: 0 },
      prospectos:            { total_prospectos: 0, prospectos_interesados: 0, prospectos_no_interesados: 0, prospectos_no_contesta: 0, prospectos_volver_llamar: 0, prospectos_buzon: 0, prospectos_tiene_proveedor: 0, prospectos_con_web: 0, prospectos_sin_web: 0, prospectos_hoy: 0, prospectos_mes: 0 },
      ventas:                { cerradas: 0, en_proceso: 0, no: 0 },
      tasa_conversion:       0,
      prospectos_por_ciudad: [],
      prospectos_por_estado: [],
      finanzas:              { ingresos_mes: 0, ingresos_anio: 0 },
    };
  }
}
