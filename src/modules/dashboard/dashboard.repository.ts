/** src/modules/dashboard/dashboard.repository.ts */

import { pool } from "../../server/config/database";

export const DashboardRepository = {

  async getKPIs(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const andOWhere = whereFecha ? "AND" : "WHERE";

    const result = await pool.query(`
      SELECT

        -- LLAMADAS
        (SELECT COUNT(*) FROM llamadas ${filtro}) AS total_llamadas,
        (SELECT COUNT(*) FROM llamadas ${filtro} ${andOWhere} contestada = true) AS llamadas_contestadas,
        (SELECT COUNT(*) FROM llamadas ${filtro} ${andOWhere} contestada = false) AS llamadas_no_contestadas,

        -- MENSAJES POR CANAL (brochures = mensajes enviados)
        (SELECT COUNT(*) FROM brochures ${filtro}) AS total_brochures,
        (SELECT COUNT(*) FROM brochures ${filtro} ${andOWhere} canal = 'correo') AS brochures_correo,
        (SELECT COUNT(*) FROM brochures ${filtro} ${andOWhere} canal = 'whatsapp') AS brochures_whatsapp,

        -- PROSPECTOS
        (SELECT COUNT(*) FROM prospectos ${filtro}) AS total_prospectos,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'interesado') AS prospectos_interesados,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'no_interesado') AS prospectos_no_interesados,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'no_contesta') AS prospectos_no_contesta,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'volver_a_llamar') AS prospectos_volver_llamar,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'buzon_de_voz') AS prospectos_buzon,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'ya_tiene_proveedor') AS prospectos_tiene_proveedor,

        -- PROSPECTOS CON/SIN WEB
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} web_activa = 'true') AS prospectos_con_web,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} web_activa = 'false') AS prospectos_sin_web,

        -- VENTAS
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_venta = 'si') AS ventas_cerradas,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_venta = 'en_proceso') AS ventas_en_proceso,
        (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_venta = 'no') AS ventas_no,

        -- TASA DE CONVERSION
        CASE
          WHEN (SELECT COUNT(*) FROM prospectos ${filtro}) = 0 THEN 0
          ELSE ROUND(
            (SELECT COUNT(*) FROM prospectos ${filtro} ${andOWhere} estado_lead = 'interesado')::numeric * 100 /
            (SELECT COUNT(*) FROM prospectos ${filtro})::numeric, 1
          )
        END AS tasa_conversion,

        -- REUNIONES
        (SELECT COUNT(*) FROM reuniones ${filtro}) AS total_reuniones,
        (SELECT COUNT(*) FROM reuniones ${filtro} ${andOWhere} estado = 'programada') AS reuniones_programadas,
        (SELECT COUNT(*) FROM reuniones ${filtro} ${andOWhere} estado = 'realizada') AS reuniones_realizadas,
        (SELECT COUNT(*) FROM reuniones ${filtro} ${andOWhere} estado = 'cancelada') AS reuniones_canceladas,
        (SELECT COUNT(*) FROM reuniones ${filtro} ${andOWhere} estado = 'descartada') AS reuniones_descartadas,

        -- FINANZAS
        COALESCE((SELECT ROUND(SUM(monto), 2) FROM finanzas ${filtro}), 0) AS ingresos
    `);

    return result.rows[0];
  },

  async llamadasPorCanal(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const result = await pool.query(`
      SELECT canal, COUNT(*)::INT AS cantidad
      FROM llamadas ${filtro}
      GROUP BY canal
      ORDER BY cantidad DESC
    `);
    return result.rows;
  },

  async llamadasPorMes(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon') AS mes,
        COUNT(*)::INT AS total
      FROM llamadas ${filtro}
      GROUP BY mes, DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    return result.rows;
  },

  async reunionesPorEstado(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const result = await pool.query(`
      SELECT estado, COUNT(*)::INT AS total
      FROM reuniones ${filtro}
      GROUP BY estado
      ORDER BY total DESC
    `);
    return result.rows;
  },

  async prospectosPorCiudad(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const result = await pool.query(`
      SELECT
        COALESCE(ciudad, 'Sin ciudad') AS ciudad,
        COUNT(*)::INT AS total
      FROM prospectos ${filtro}
      GROUP BY ciudad
      ORDER BY total DESC
      LIMIT 10
    `);
    return result.rows;
  },

  async prospectosPorEstado(whereFecha?: string) {
    const filtro = whereFecha ? `WHERE ${whereFecha}` : "";
    const result = await pool.query(`
      SELECT estado_lead, COUNT(*)::INT AS total
      FROM prospectos ${filtro}
      GROUP BY estado_lead
      ORDER BY total DESC
    `);
    return result.rows;
  },
};