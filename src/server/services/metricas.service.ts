import { pool } from "../config/database";
import type { MetricaInput } from "../schemas/metricas.schema";

export async function crearMetricaService(input: MetricaInput) {
  const result = await pool.query(
    `INSERT INTO campana_metricas (
      empresa, campana_nombre, plataforma, sub_plataforma,
      periodo_inicio, periodo_fin,
      impresiones, alcance, clics, ctr,
      gasto, cpc, cpm, cpa,
      conversiones, leads, mensajes, roas, roi, costo_por_lead,
      seguidores_ganados, perfil_visitas,
      me_gusta, comentarios, compartidos, guardados, tasa_engagement,
      costo_por_mensaje,
      reproducciones, tasa_reproduccion,
      notas
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
    ) RETURNING *`,
    [
      input.empresa, input.campana_nombre, input.plataforma, input.sub_plataforma ?? null,
      input.periodo_inicio, input.periodo_fin,
      input.impresiones, input.alcance, input.clics, input.ctr,
      input.gasto, input.cpc, input.cpm, input.cpa,
      input.conversiones, input.leads, (input as any).mensajes ?? 0,
      input.roas, input.roi, (input as any).costo_por_lead ?? 0,
      input.seguidores_ganados, input.perfil_visitas,
      input.me_gusta, input.comentarios, input.compartidos, input.guardados, input.tasa_engagement,
      (input as any).costo_por_mensaje ?? 0,
      input.reproducciones, input.tasa_reproduccion,
      input.notas ?? null,
    ]
  );
  return result.rows[0];
}

export async function listarMetricasService(filtros?: {
  empresa?: string;
  plataforma?: string;
  sub_plataforma?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (filtros?.empresa) {
    condiciones.push(`empresa ILIKE $${i++}`);
    valores.push(`%${filtros.empresa}%`);
  }
  if (filtros?.plataforma) {
    condiciones.push(`plataforma = $${i++}`);
    valores.push(filtros.plataforma);
  }
  if (filtros?.sub_plataforma) {
    condiciones.push(`sub_plataforma = $${i++}`);
    valores.push(filtros.sub_plataforma);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM campana_metricas ${where} ORDER BY periodo_inicio DESC LIMIT 200`,
    valores
  );
  return result.rows;
}

export async function obtenerMetricaPorIdService(id: string) {
  const result = await pool.query(`SELECT * FROM campana_metricas WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function actualizarMetricaService(id: string, input: Partial<MetricaInput>) {
  const campos = Object.keys(input) as (keyof MetricaInput)[];
  if (campos.length === 0) return null;

  const sets = campos.map((c, i) => `${String(c)} = $${i + 1}`).join(", ");
  const valores = campos.map((c) => input[c]);

  const result = await pool.query(
    `UPDATE campana_metricas SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`,
    [...valores, id]
  );
  return result.rows[0] ?? null;
}

export async function eliminarMetricaService(id: string) {
  await pool.query(`DELETE FROM campana_metricas WHERE id = $1`, [id]);
}

export async function eliminarMetricasMasivoService(ids: string[]) {
  if (!ids.length) return 0;
  const result = await pool.query(
    `DELETE FROM campana_metricas WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return result.rowCount;
}

export async function resumenMetricasService(empresa?: string) {
  const valores: any[] = [];
  const where = empresa ? `WHERE empresa ILIKE $1` : "";
  if (empresa) valores.push(`%${empresa}%`);

  const result = await pool.query(`
    SELECT
      plataforma,
      sub_plataforma,
      COUNT(*)                        AS campanas,
      SUM(gasto)                      AS total_gasto,
      SUM(leads)                      AS total_leads,
      SUM(conversiones)               AS total_conversiones,
      SUM(seguidores_ganados)         AS total_seguidores,
      SUM(reproducciones)             AS total_reproducciones,
      ROUND(AVG(roas)::numeric, 2)    AS roas_promedio,
      ROUND(AVG(cpa)::numeric, 2)     AS cpa_promedio,
      ROUND(AVG(tasa_engagement)::numeric, 2) AS engagement_promedio
    FROM campana_metricas
    ${where}
    GROUP BY plataforma, sub_plataforma
    ORDER BY plataforma, sub_plataforma
  `, valores);
  return result.rows;
}
