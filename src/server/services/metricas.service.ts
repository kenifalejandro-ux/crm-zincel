import { pool } from "../config/database";
import type { MetricaInput } from "../schemas/metricas.schema";
import { previewMetaInsights } from "./metaAds.service";
import { previewTikTokInsights } from "./tiktokAds.service";

export async function crearMetricaService(input: MetricaInput) {
  const result = await pool.query(
    `INSERT INTO campana_metricas (
      empresa, campana_nombre, plataforma, sub_plataforma,
      periodo_inicio, periodo_fin,
      impresiones, alcance, clics, ctr,
      moneda_gasto, gasto, cpc, cpm, cpa,
      conversiones, leads, mensajes, roas, roi, costo_por_lead,
      seguidores_ganados, perfil_visitas,
      interacciones,
      me_gusta, comentarios, compartidos, guardados, tasa_engagement,
      costo_por_mensaje,
      reproducciones, tasa_reproduccion,
      notas
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
      $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
    ) RETURNING *`,
    [
      input.empresa, input.campana_nombre, input.plataforma, input.sub_plataforma ?? null,
      input.periodo_inicio, input.periodo_fin,
      input.impresiones, input.alcance, input.clics, input.ctr,
      input.moneda_gasto ?? "USD", input.gasto, input.cpc, input.cpm, input.cpa,
      input.conversiones, input.leads, input.mensajes,
      input.roas, input.roi, input.costo_por_lead,
      input.seguidores_ganados, input.perfil_visitas,
      input.interacciones,
      input.me_gusta, input.comentarios, input.compartidos, input.guardados, input.tasa_engagement,
      input.costo_por_mensaje,
      input.reproducciones, input.tasa_reproduccion,
      input.notas ?? null,
    ]
  );
  return result.rows[0];
}

export async function getProyectosService(empresa?: string): Promise<string[]> {
  const where = empresa
    ? `WHERE empresa ILIKE $1 AND cardinality(proyectos) > 0`
    : `WHERE cardinality(proyectos) > 0`;
  const vals = empresa ? [`%${empresa}%`] : [];
  const result = await pool.query(
    `SELECT DISTINCT UNNEST(proyectos) AS proyecto
     FROM campana_metricas
     ${where}
     ORDER BY proyecto`,
    vals
  );
  return result.rows.map((r: any) => r.proyecto).filter(Boolean);
}

export async function asignarProyectosBulkService(ids: string[], proyectos: string[]) {
  await pool.query(
    `UPDATE campana_metricas SET proyectos = $1 WHERE id = ANY($2::uuid[])`,
    [proyectos, ids]
  );
}

export async function actualizarProyectosMetricaService(id: string, proyectos: string[]) {
  await pool.query(
    `UPDATE campana_metricas SET proyectos = $1 WHERE id = $2`,
    [proyectos, id]
  );
}

export async function listarMetricasService(filtros?: {
  empresa?: string;
  plataforma?: string;
  sub_plataforma?: string;
  desde?: string;
  hasta?: string;
  proyecto?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (filtros?.empresa) {
    condiciones.push(`cm.empresa ILIKE $${i++}`);
    valores.push(`%${filtros.empresa}%`);
  }
  if (filtros?.plataforma) {
    condiciones.push(`cm.plataforma = $${i++}`);
    valores.push(filtros.plataforma);
  }
  if (filtros?.sub_plataforma) {
    condiciones.push(`cm.sub_plataforma = $${i++}`);
    valores.push(filtros.sub_plataforma);
  }
  if (filtros?.desde) {
    condiciones.push(`cm.periodo_fin >= $${i++}`);
    valores.push(filtros.desde);
  }
  if (filtros?.hasta) {
    condiciones.push(`cm.periodo_inicio <= $${i++}`);
    valores.push(filtros.hasta);
  }
  if (filtros?.proyecto) {
    condiciones.push(`$${i++} = ANY(cm.proyectos)`);
    valores.push(filtros.proyecto);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT cm.*,
      COALESCE(rv.ventas_count, 0)::int   AS ventas_count,
      COALESCE(rv.ingresos_atribuidos, 0) AS ingresos_atribuidos,
      rv.mejor_confianza
     FROM campana_metricas cm
     LEFT JOIN (
       SELECT
         rcr.metrica_id,
         COUNT(DISTINCT r.id)                                                      AS ventas_count,
         SUM(r.monto)                                                              AS ingresos_atribuidos,
         CASE
           WHEN COUNT(*) FILTER (WHERE r.confianza_atribucion = 'confirmada') > 0 THEN 'confirmada'
           WHEN COUNT(*) FILTER (WHERE r.confianza_atribucion = 'probable')   > 0 THEN 'probable'
           ELSE 'sin_datos'
         END                                                                       AS mejor_confianza
       FROM resultado_campana_rel rcr
       JOIN resultados_campana r ON r.id = rcr.resultado_id
       GROUP BY rcr.metrica_id
     ) rv ON rv.metrica_id = cm.id
     ${where}
     ORDER BY cm.periodo_inicio DESC LIMIT 200`,
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
      ROUND(AVG(NULLIF(cpa, 0))::numeric, 2) AS cpa_promedio,
      ROUND(AVG(tasa_engagement)::numeric, 2) AS engagement_promedio
    FROM campana_metricas
    ${where}
    GROUP BY plataforma, sub_plataforma
    ORDER BY plataforma, sub_plataforma
  `, valores);
  return result.rows;
}

// ─── Refresh individual de campaña desde la plataforma ────────────────────────
export async function refreshMetricaService(id: string) {
  const { rows } = await pool.query(
    `SELECT id, empresa, plataforma, campana_nombre,
            platform_campaign_id, periodo_inicio, periodo_fin
     FROM campana_metricas WHERE id = $1`,
    [id]
  );
  const m = rows[0];
  if (!m) throw new Error("Métrica no encontrada");
  if (!m.platform_campaign_id) {
    throw new Error("No tiene platform_campaign_id — fue ingresada manualmente o aún no ha sido sincronizada vía API");
  }

  const desde = m.periodo_inicio instanceof Date
    ? m.periodo_inicio.toISOString().split("T")[0]
    : String(m.periodo_inicio);
  const hasta = m.periodo_fin instanceof Date
    ? m.periodo_fin.toISOString().split("T")[0]
    : String(m.periodo_fin);

  if (m.plataforma === "meta") {
    const insights = await previewMetaInsights(m.empresa, desde, hasta);
    const ins = insights.find(i => i.campaign_id === m.platform_campaign_id);
    if (!ins) throw new Error("La campaña ya no existe o no tiene datos en el rango de fechas");

    const n = (v?: string) => parseFloat(v ?? "0") || 0;
    const gasto = n(ins.spend);
    const leads  = ins.actions?.filter(a => ["lead","offsite_conversion.fb_pixel_lead","onsite_conversion.lead_grouped"].includes(a.action_type))
      .reduce((s, a) => s + parseFloat(a.value), 0) ?? 0;
    const mensajes = ins.actions?.filter(a => a.action_type === "onsite_conversion.messaging_conversation_started_7d")
      .reduce((s, a) => s + parseFloat(a.value), 0) ?? 0;
    const conversiones = ins.actions?.filter(a => ["offsite_conversion.fb_pixel_purchase","purchase"].includes(a.action_type))
      .reduce((s, a) => s + parseFloat(a.value), 0) ?? 0;
    const ingresos = ins.action_values?.filter(a => a.action_type === "offsite_conversion.fb_pixel_purchase")
      .reduce((s, a) => s + parseFloat(a.value), 0) ?? 0;
    const interacciones = ins.actions?.filter(a => a.action_type === "post_engagement")
      .reduce((s, a) => s + parseFloat(a.value), 0) ?? 0;
    const roas = gasto > 0 ? parseFloat((ingresos / gasto).toFixed(2)) : 0;
    const cpa  = leads  > 0 ? parseFloat((gasto / leads).toFixed(2)) : 0;
    const costo_por_lead    = leads > 0    ? parseFloat((gasto / leads).toFixed(2))    : 0;
    const costo_por_mensaje = mensajes > 0 ? parseFloat((gasto / mensajes).toFixed(2)) : 0;

    const { rows: updated } = await pool.query(
      `UPDATE campana_metricas SET
        impresiones       = $1,  alcance         = $2,  clics           = $3,
        ctr               = $4,  gasto           = $5,  cpc             = $6,
        cpm               = $7,  cpa             = $8,  conversiones    = $9,
        leads             = $10, mensajes        = $11, roas            = $12,
        costo_por_lead    = $13, frecuencia      = $14, interacciones   = $15,
        costo_por_mensaje = $16, actualizado_en  = NOW()
       WHERE id = $17 RETURNING *`,
      [
        n(ins.impressions), n(ins.reach), n(ins.clicks),
        n(ins.ctr), gasto, n(ins.cpc),
        n(ins.cpm), cpa, conversiones,
        leads, mensajes, roas,
        costo_por_lead, n(ins.frequency), interacciones,
        costo_por_mensaje, id,
      ]
    );
    return updated[0];
  }

  if (m.plataforma === "tiktok") {
    const insights = await previewTikTokInsights(m.empresa, desde, hasta);
    const ins = insights.find(i => i.campaign_id === m.platform_campaign_id);
    if (!ins) throw new Error("La campaña ya no existe o no tiene datos en el rango de fechas");

    const { rows: updated } = await pool.query(
      `UPDATE campana_metricas SET
        impresiones = $1, alcance = $2, clics = $3,
        ctr = $4, gasto = $5, cpc = $6, cpm = $7,
        actualizado_en = NOW()
       WHERE id = $8 RETURNING *`,
      [
        parseFloat(ins.impressions) || 0,
        parseFloat(ins.reach)       || 0,
        parseFloat(ins.clicks)      || 0,
        parseFloat(ins.ctr)         || 0,
        parseFloat(ins.spend)       || 0,
        parseFloat(ins.cpc)         || 0,
        parseFloat(ins.cpm)         || 0,
        id,
      ]
    );
    return updated[0];
  }

  throw new Error(`Refresh no disponible para plataforma: ${m.plataforma}`);
}
