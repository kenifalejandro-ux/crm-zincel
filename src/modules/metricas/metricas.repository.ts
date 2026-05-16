/** server/modules/metricas/metricas.repository.ts */

import { pool as db } from "../../server/config/database";
import { MetricaInput } from "../../server/schemas/metricas.schema";

export const metricasRepository = {

  async crear(data: MetricaInput & { creado_por: string }) {
    const { rows } = await db.query(
      `INSERT INTO campana_metricas (
        empresa, campana_nombre, plataforma, sub_plataforma,
        periodo_inicio, periodo_fin,
        impresiones, alcance, clics, ctr,
        gasto, cpc, cpm, cpa,
        conversiones, leads, roas, roi,
        seguidores_ganados, perfil_visitas,
        me_gusta, comentarios, compartidos, guardados, tasa_engagement,
        reproducciones, tasa_reproduccion,
        notas, creado_por
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      ) RETURNING *`,
      [
        data.empresa, data.campana_nombre, data.plataforma, data.sub_plataforma ?? null,
        data.periodo_inicio, data.periodo_fin,
        data.impresiones, data.alcance, data.clics, data.ctr,
        data.gasto, data.cpc, data.cpm, data.cpa,
        data.conversiones, data.leads, data.roas, data.roi,
        data.seguidores_ganados, data.perfil_visitas,
        data.me_gusta, data.comentarios, data.compartidos, data.guardados, data.tasa_engagement,
        data.reproducciones, data.tasa_reproduccion,
        data.notas ?? null, data.creado_por,
      ]
    );
    return rows[0];
  },

  async listar(filtros: { empresa?: string; plataforma?: string; sub_plataforma?: string }) {
    const condiciones: string[] = [];
    const valores:     any[]    = [];
    let i = 1;

    if (filtros.empresa) {
      condiciones.push(`empresa ILIKE $${i++}`);
      valores.push(`%${filtros.empresa}%`);
    }
    if (filtros.plataforma) {
      condiciones.push(`plataforma = $${i++}`);
      valores.push(filtros.plataforma);
    }
    if (filtros.sub_plataforma) {
      condiciones.push(`sub_plataforma = $${i++}`);
      valores.push(filtros.sub_plataforma);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const { rows } = await db.query(
      `SELECT * FROM campana_metricas ${where} ORDER BY periodo_inicio DESC`,
      valores
    );
    return rows;
  },

  async porId(id: string) {
    const { rows } = await db.query(
      `SELECT * FROM campana_metricas WHERE id = $1`, [id]
    );
    return rows[0] ?? null;
  },

  async actualizar(id: string, data: Partial<MetricaInput>) {
    const campos  = Object.keys(data);
    const valores = Object.values(data);
    const sets    = campos.map((c, i) => `${c} = $${i + 1}`).join(", ");
    const { rows } = await db.query(
      `UPDATE campana_metricas SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`,
      [...valores, id]
    );
    return rows[0];
  },

  async eliminar(id: string) {
    await db.query(`DELETE FROM campana_metricas WHERE id = $1`, [id]);
  },

  async resumenPorEmpresa(empresa: string) {
    const { rows } = await db.query(
      `SELECT
         plataforma,
         sub_plataforma,
         COUNT(*)                          AS campanas,
         SUM(gasto)                        AS total_gasto,
         SUM(leads)                        AS total_leads,
         SUM(conversiones)                 AS total_conversiones,
         SUM(seguidores_ganados)           AS total_seguidores,
         SUM(reproducciones)               AS total_reproducciones,
         ROUND(AVG(roas)::numeric, 2)      AS roas_promedio,
         ROUND(AVG(cpa)::numeric, 2)       AS cpa_promedio,
         ROUND(AVG(tasa_engagement)::numeric, 2) AS engagement_promedio
       FROM campana_metricas
       WHERE empresa ILIKE $1
       GROUP BY plataforma, sub_plataforma`,
      [`%${empresa}%`]
    );
    return rows;
  },
};