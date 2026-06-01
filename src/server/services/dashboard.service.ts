/**src/server/services/dashboard.service.ts */

import { pool } from "../config/database";
import { cacheGet, cacheSet } from "../config/cache";

export async function metricasDashboardService(
  periodo: string = "mes",
  mes?: number,
  anio?: number,
  fecha?: string
) {
  const cacheKey = `dashboard:${periodo}:${mes ?? ""}:${anio ?? ""}:${fecha ?? ""}`;
  // TTL corto para hoy/día (datos en tiempo real), más largo para históricos
  const cacheTTL = (periodo === "hoy" || periodo === "dia") ? 300 : 1800; // 5 min o 30 min
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const buildFiltro = (columna: string) => {
    if (periodo === "dia" && fecha) {
      return `${columna}::date = '${fecha}'`;
    }
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
        return `${columna} >= DATE_TRUNC('year', NOW())`;
      case "todo":
        return `1=1`;
      default:
        return `${columna} >= CURRENT_DATE - INTERVAL '30 days'`;
    }
  };

  const filtroLlamadas    = buildFiltro("fecha");
  const filtroBrochures   = buildFiltro("fecha_envio");
  const filtroReuniones   = buildFiltro("fecha_hora");
  const filtroProspectos  = buildFiltro("creado_en");
  const filtroIngresos    = buildFiltro("fecha");
  const filtroVentas      = buildFiltro("fecha_cierre");
  const filtroPropuestas  = buildFiltro("fecha_propuesta");

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
      ventasResult,
      ventasPorServicioResult,
      propuestasResult,
    ] = await Promise.all([

      pool.query(`
        SELECT
          COUNT(DISTINCT prospecto_id)::int AS total_llamadas,
          COUNT(DISTINCT CASE WHEN contestada = true  THEN prospecto_id END)::int AS llamadas_contestadas,
          (COUNT(DISTINCT prospecto_id) - COUNT(DISTINCT CASE WHEN contestada = true THEN prospecto_id END))::int AS llamadas_no_contestadas
        FROM llamadas
        WHERE ${filtroLlamadas}
      `).catch(() => ({
        rows: [{ total_llamadas: 0, llamadas_contestadas: 0, llamadas_no_contestadas: 0 }]
      })),

      pool.query(`
        SELECT canal, COUNT(DISTINCT prospecto_id)::int AS cantidad
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
          (SELECT COUNT(*)::int FROM prospectos)                                        AS total_prospectos,
          COUNT(*) FILTER (WHERE estado_lead = 'interesado')::int                      AS prospectos_interesados,
          COUNT(*) FILTER (WHERE estado_lead = 'no_interesado')::int                   AS prospectos_no_interesados,
          COUNT(*) FILTER (WHERE estado_lead = 'no_contesta')::int                     AS prospectos_no_contesta,
          COUNT(*) FILTER (WHERE estado_lead = 'volver_a_llamar')::int                 AS prospectos_volver_llamar,
          COUNT(*) FILTER (WHERE estado_lead = 'buzon_de_voz')::int                    AS prospectos_buzon,
          COUNT(*) FILTER (WHERE estado_lead = 'ya_tiene_proveedor')::int              AS prospectos_tiene_proveedor,
          COUNT(*) FILTER (WHERE web_activa = true)::int                               AS prospectos_con_web,
          COUNT(*) FILTER (WHERE web_activa = false)::int                              AS prospectos_sin_web,
          COUNT(*) FILTER (WHERE web_activa = true AND estado_web = 'actualizada')::int                  AS web_actualizada,
          COUNT(*) FILTER (WHERE web_activa = true AND estado_web = 'por_actualizar')::int               AS web_por_actualizar,
          COUNT(*) FILTER (WHERE web_activa = true AND estado_web = 'vencida')::int                      AS web_vencida,
          COUNT(*) FILTER (WHERE web_activa = true AND estado_web = 'en_mantenimiento')::int             AS web_en_mantenimiento,
          COUNT(*) FILTER (WHERE web_activa = true AND (estado_web = 'sin_informacion' OR estado_web IS NULL))::int AS web_sin_informacion,
          COUNT(*) FILTER (WHERE estado_venta = 'si')::int                             AS ventas_cerradas,
          COUNT(*) FILTER (WHERE estado_venta = 'en_proceso')::int                     AS ventas_en_proceso,
          COUNT(*) FILTER (WHERE estado_venta = 'no')::int                             AS ventas_no,
          CASE
            WHEN (SELECT COUNT(*) FROM prospectos) = 0 THEN 0
            ELSE ROUND(
              COUNT(*) FILTER (WHERE estado_lead = 'interesado')::numeric * 100 /
              (SELECT COUNT(*)::numeric FROM prospectos), 1
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
          COALESCE(NULLIF(TRIM(region), ''), 'Sin región') AS region,
          COUNT(*)::int AS total
        FROM prospectos
        GROUP BY region
        ORDER BY total DESC
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT estado_lead, COUNT(*)::int AS total
        FROM prospectos
        WHERE ${filtroProspectos}
        GROUP BY estado_lead
        ORDER BY total DESC
      `).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT COALESCE(SUM(
          CASE WHEN moneda = 'USD' THEN monto_total * tipo_cambio ELSE monto_total END
        ), 0)::numeric AS ingresos_mes
        FROM ingresos
        WHERE ${filtroIngresos}
      `).catch(() => ({
        rows: [{ ingresos_mes: 0 }]
      })),

      // Ventas: cerradas desde propuestas, en_proceso y no_venta desde prospectos filtrados por período
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM propuestas WHERE estado = 'cerrada_ganada' AND fecha_cierre IS NOT NULL AND ${filtroVentas}) AS cerradas,
          COUNT(*) FILTER (WHERE estado_venta = 'en_proceso')::int AS en_proceso,
          COUNT(*) FILTER (WHERE estado_venta = 'no')::int         AS no_venta
        FROM prospectos
        WHERE ${filtroProspectos}
      `).catch(() => ({ rows: [{ cerradas: 0, en_proceso: 0, no_venta: 0 }] })),

      // Ventas cerradas por tipo de servicio en el período
      pool.query(`
        SELECT
          servicio,
          COUNT(*)::int AS cantidad,
          COALESCE(SUM(
            CASE WHEN moneda = 'USD' THEN COALESCE(monto_cerrado, monto_propuesto) * tipo_cambio
                 ELSE COALESCE(monto_cerrado, monto_propuesto) END
          ), 0)::float AS monto_total
        FROM propuestas
        WHERE estado = 'cerrada_ganada' AND fecha_cierre IS NOT NULL AND ${filtroVentas}
        GROUP BY servicio
        ORDER BY monto_total DESC
      `).catch(() => ({ rows: [] })),

      // Propuestas del período
      pool.query(`
        SELECT
          COUNT(*)::int                                                                   AS total_propuestas,
          COUNT(*) FILTER (WHERE estado = 'cerrada_ganada')::int                         AS propuestas_ganadas,
          COUNT(*) FILTER (WHERE estado = 'cerrada_perdida')::int                        AS propuestas_perdidas,
          COUNT(*) FILTER (WHERE estado NOT IN ('cerrada_ganada','cerrada_perdida'))::int AS propuestas_activas
        FROM propuestas
        WHERE ${filtroPropuestas}
      `).catch(() => ({ rows: [{ total_propuestas: 0, propuestas_ganadas: 0, propuestas_perdidas: 0, propuestas_activas: 0 }] })),
    ]);

    const ll = llamadasResult.rows[0];
    const br = brochuresResult.rows[0];
    const re = reunionesResult.rows[0];
    const pr = prospectosResult.rows[0];
    const fi = finanzasResult.rows[0];
    const vt = ventasResult.rows[0];
    const pp = propuestasResult.rows[0];

    const dashResult = {
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
        web_actualizada:            pr.web_actualizada,
        web_por_actualizar:         pr.web_por_actualizar,
        web_vencida:                pr.web_vencida,
        web_en_mantenimiento:       pr.web_en_mantenimiento,
        web_sin_informacion:        pr.web_sin_informacion,
        prospectos_hoy:             pr.total_prospectos,
        prospectos_mes:             pr.total_prospectos,
      },

      ventas: {
        cerradas:   vt.cerradas,
        en_proceso: vt.en_proceso,
        no:         vt.no_venta,
      },
      ventas_por_servicio: ventasPorServicioResult.rows as Array<{ servicio: string; cantidad: number; monto_total: number }>,

      tasa_conversion: Number(pr.tasa_conversion),

      prospectos_por_ciudad: prospectosPorCiudadResult.rows as Array<{ region: string; total: number }>,
      prospectos_por_estado: prospectosPorEstadoResult.rows,

      finanzas: {
        ingresos_mes:  Number(fi.ingresos_mes),
        ingresos_anio: Number(fi.ingresos_mes),
      },

      propuestas: {
        total_propuestas:    pp.total_propuestas,
        propuestas_ganadas:  pp.propuestas_ganadas,
        propuestas_perdidas: pp.propuestas_perdidas,
        propuestas_activas:  pp.propuestas_activas,
        propuestas_hoy:      pp.total_propuestas,
        propuestas_mes:      pp.total_propuestas,
      },
    };

    await cacheSet(cacheKey, dashResult, cacheTTL);
    return dashResult;

  } catch (error) {
    console.error('Error general en metricasDashboardService:', error);
    return {
      llamadas:              { total_llamadas: 0, llamadas_contestadas: 0, llamadas_no_contestadas: 0, llamadas_hoy: 0, llamadas_mes: 0 },
      llamadas_por_canal:    [],
      brochures_por_canal:   [],
      brochures:             { total_brochures: 0, brochures_correo: 0, brochures_whatsapp: 0, brochures_hoy: 0, brochures_mes: 0 },
      reuniones:             { total_reuniones: 0, reuniones_programadas: 0, reuniones_realizadas: 0, reuniones_canceladas: 0, reuniones_descartadas: 0, reuniones_reprogramadas: 0, reuniones_hoy: 0, reuniones_mes: 0 },
      prospectos:            { total_prospectos: 0, prospectos_interesados: 0, prospectos_no_interesados: 0, prospectos_no_contesta: 0, prospectos_volver_llamar: 0, prospectos_buzon: 0, prospectos_tiene_proveedor: 0, prospectos_con_web: 0, prospectos_sin_web: 0, web_actualizada: 0, web_por_actualizar: 0, web_vencida: 0, web_en_mantenimiento: 0, web_sin_informacion: 0, prospectos_hoy: 0, prospectos_mes: 0 },
      propuestas:            { total_propuestas: 0, propuestas_ganadas: 0, propuestas_perdidas: 0, propuestas_activas: 0, propuestas_hoy: 0, propuestas_mes: 0 },
      ventas:                { cerradas: 0, en_proceso: 0, no: 0 },
      ventas_por_servicio:   [],
      tasa_conversion:       0,
      prospectos_por_ciudad: [],
      prospectos_por_estado: [],
      finanzas:              { ingresos_mes: 0, ingresos_anio: 0 },
    };
  }
}


export async function actividadAnualService(anio: number) {
  const inicio = `${anio}-01-01`;
  const fin    = `${anio + 1}-01-01`;

  const [llamadas, reuniones, brochures, propuestas] = await Promise.all([
    pool.query(`
      SELECT EXTRACT(MONTH FROM fecha)::int AS mes, COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE contestada = true)::int AS contestadas
      FROM llamadas WHERE fecha >= $1 AND fecha < $2
      GROUP BY mes ORDER BY mes`, [inicio, fin]),

    pool.query(`
      SELECT EXTRACT(MONTH FROM fecha_hora)::int AS mes, COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE estado = 'realizada')::int AS realizadas
      FROM reuniones WHERE fecha_hora >= $1 AND fecha_hora < $2
      GROUP BY mes ORDER BY mes`, [inicio, fin]),

    pool.query(`
      SELECT EXTRACT(MONTH FROM fecha_envio)::int AS mes, COUNT(*)::int AS total
      FROM brochures WHERE fecha_envio >= $1 AND fecha_envio < $2
      GROUP BY mes ORDER BY mes`, [inicio, fin]),

    pool.query(`
      SELECT EXTRACT(MONTH FROM fecha_cierre)::int AS mes, COUNT(*)::int AS total
      FROM propuestas WHERE estado = 'cerrada_ganada' AND fecha_cierre >= $1 AND fecha_cierre < $2
      GROUP BY mes ORDER BY mes`, [inicio, fin]),
  ]);

  const toMap = (rows: any[], key: string) => {
    const m: Record<number, any> = {};
    rows.forEach((r) => { m[r.mes] = r; });
    return m;
  };

  const llMap  = toMap(llamadas.rows,   "mes");
  const reMap  = toMap(reuniones.rows,  "mes");
  const brMap  = toMap(brochures.rows,  "mes");
  const prMap  = toMap(propuestas.rows, "mes");

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return {
      mes:         m,
      label:       MESES[i],
      llamadas:    llMap[m]?.total       ?? 0,
      contestadas: llMap[m]?.contestadas ?? 0,
      reuniones:   reMap[m]?.total       ?? 0,
      realizadas:  reMap[m]?.realizadas  ?? 0,
      brochures:   brMap[m]?.total       ?? 0,
      ventas:      prMap[m]?.total       ?? 0,
    };
  });
}

export async function actividadMensualService(anio: number, mes: number) {
  const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const fin    = mes === 12
    ? `${anio + 1}-01-01`
    : `${anio}-${String(mes + 1).padStart(2, "0")}-01`;

  const [llamadas, reuniones, brochures] = await Promise.all([
    pool.query(`
      SELECT EXTRACT(DAY FROM fecha)::int AS dia,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE contestada = true)::int AS contestadas
      FROM llamadas WHERE fecha >= $1 AND fecha < $2
      GROUP BY dia ORDER BY dia`, [inicio, fin]),

    pool.query(`
      SELECT EXTRACT(DAY FROM fecha_hora)::int AS dia,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE estado = 'realizada')::int AS realizadas
      FROM reuniones WHERE fecha_hora >= $1 AND fecha_hora < $2
      GROUP BY dia ORDER BY dia`, [inicio, fin]),

    pool.query(`
      SELECT EXTRACT(DAY FROM fecha_envio)::int AS dia,
             COUNT(*)::int AS total
      FROM brochures WHERE fecha_envio >= $1 AND fecha_envio < $2
      GROUP BY dia ORDER BY dia`, [inicio, fin]),
  ]);

  const toMap = (rows: any[]) => {
    const m: Record<number, any> = {};
    rows.forEach((r) => { m[r.dia] = r; });
    return m;
  };

  const llMap = toMap(llamadas.rows);
  const reMap = toMap(reuniones.rows);
  const brMap = toMap(brochures.rows);

  const diasEnMes = new Date(anio, mes, 0).getDate();

  return Array.from({ length: diasEnMes }, (_, i) => {
    const d = i + 1;
    return {
      dia:         d,
      label:       String(d),
      llamadas:    llMap[d]?.total       ?? 0,
      contestadas: llMap[d]?.contestadas ?? 0,
      reuniones:   reMap[d]?.total       ?? 0,
      realizadas:  reMap[d]?.realizadas  ?? 0,
      brochures:   brMap[d]?.total       ?? 0,
    };
  });
}
