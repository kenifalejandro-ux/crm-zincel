/** server/services/resultados.service.ts */

import { pool } from "../config/database";

// ── Junction table helpers ────────────────────────────────────────────────────

async function insertarRelaciones(resultadoId: string, metricaIds: string[]) {
  if (!metricaIds.length) return;
  const vals = metricaIds.map((_, i) => `($1, $${i + 2})`).join(", ");
  await pool.query(
    `INSERT INTO resultado_campana_rel (resultado_id, metrica_id)
     VALUES ${vals}
     ON CONFLICT DO NOTHING`,
    [resultadoId, ...metricaIds]
  );
}

async function reemplazarRelaciones(resultadoId: string, metricaIds: string[]) {
  await pool.query(
    `DELETE FROM resultado_campana_rel WHERE resultado_id = $1`,
    [resultadoId]
  );
  await insertarRelaciones(resultadoId, metricaIds);
}

async function obtenerMetricasDeResultado(resultadoId: string): Promise<string[]> {
  const r = await pool.query(
    `SELECT metrica_id FROM resultado_campana_rel WHERE resultado_id = $1`,
    [resultadoId]
  );
  return r.rows.map((row: any) => row.metrica_id);
}

// ── Sincroniza ingresos/ROAS/ROI de una campaña según sus resultados primarios ─

async function sincronizarMetrica(metrica_id: string) {
  await pool.query(
    `UPDATE campana_metricas cm
     SET
       ingresos    = r.total_ingresos,
       costo_total = cm.gasto + r.total_costos,
       roas = CASE
         WHEN cm.gasto > 0
         THEN LEAST(ROUND(r.total_ingresos / cm.gasto, 2), 9999.99)
         ELSE 0 END,
       roi = CASE
         WHEN (cm.gasto + r.total_costos) > 0
         THEN LEAST(ROUND(
           (r.total_ingresos - (cm.gasto + r.total_costos))
           / (cm.gasto + r.total_costos) * 100, 2
         ), 9999.99) ELSE 0 END
     FROM (
       SELECT
         COALESCE(SUM(monto),       0) AS total_ingresos,
         COALESCE(SUM(costo_venta), 0) AS total_costos
       FROM resultados_campana
       WHERE metrica_id = $1
     ) r
     WHERE cm.id = $1`,
    [metrica_id]
  );
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function crearResultadoService(input: any) {
  const metricaIds: string[] = input.metrica_ids?.length
    ? input.metrica_ids
    : input.metrica_id
    ? [input.metrica_id]
    : [];

  const primaryId = metricaIds[0] ?? null;

  const result = await pool.query(
    `INSERT INTO resultados_campana
      (empresa, metrica_id, campana_nombre, proyecto, monto, costo_venta, fecha_venta, confianza_atribucion, prospecto_id, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      input.empresa,
      primaryId,
      input.campana_nombre,
      input.proyecto ?? null,
      input.monto,
      input.costo_venta ?? 0,
      input.fecha_venta,
      input.confianza_atribucion ?? "confirmada",
      input.prospecto_id ?? null,
      input.notas ?? null,
    ]
  );

  const resultadoId = result.rows[0].id;
  if (metricaIds.length) await insertarRelaciones(resultadoId, metricaIds);
  for (const mid of metricaIds) await sincronizarMetrica(mid);

  return result.rows[0];
}

export async function listarResultadosService(filtros?: { empresa?: string; metrica_id?: string }) {
  const conds: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (filtros?.empresa)    { conds.push(`r.empresa = $${i++}`);    vals.push(filtros.empresa); }
  if (filtros?.metrica_id) { conds.push(`r.metrica_id = $${i++}`); vals.push(filtros.metrica_id); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT
       r.*,
       p.nombre_contacto AS prospecto_nombre,
       COALESCE(
         (SELECT array_agg(rel.metrica_id::text ORDER BY rel.metrica_id)
          FROM resultado_campana_rel rel WHERE rel.resultado_id = r.id),
         ARRAY[r.metrica_id::text]
       ) AS metrica_ids
     FROM resultados_campana r
     LEFT JOIN prospectos p ON p.id = r.prospecto_id
     ${where}
     ORDER BY r.fecha_venta DESC`,
    vals
  );
  return result.rows;
}

export async function actualizarResultadoService(id: string, body: any) {
  const metricaIds: string[] | undefined = body.metrica_ids?.length
    ? body.metrica_ids
    : body.metrica_id
    ? [body.metrica_id]
    : undefined;

  const camposExcluidos = new Set(["metrica_id", "metrica_ids"]);
  const campos = Object.keys(body).filter((k) => !camposExcluidos.has(k));

  // Actualizar fila principal si hay campos a cambiar
  let row: any;
  if (campos.length) {
    if (metricaIds) {
      campos.push("metrica_id");
      const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const vals = [...campos.slice(0, -1).map((k) => (body as any)[k]), metricaIds[0]];
      const r = await pool.query(
        `UPDATE resultados_campana SET ${sets} WHERE id = $1 RETURNING *`,
        [id, ...vals]
      );
      row = r.rows[0];
    } else {
      const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(", ");
      const vals = campos.map((k) => (body as any)[k]);
      const r = await pool.query(
        `UPDATE resultados_campana SET ${sets} WHERE id = $1 RETURNING *`,
        [id, ...vals]
      );
      row = r.rows[0];
    }
  } else {
    // Solo actualizar campaigns
    if (metricaIds) {
      const r = await pool.query(
        `UPDATE resultados_campana SET metrica_id = $2 WHERE id = $1 RETURNING *`,
        [id, metricaIds[0]]
      );
      row = r.rows[0];
    }
  }

  if (!row) return null;

  // Actualizar junction table si vinieron metrica_ids
  if (metricaIds) {
    await reemplazarRelaciones(id, metricaIds);
    for (const mid of metricaIds) await sincronizarMetrica(mid);
  } else if (row?.metrica_id) {
    await sincronizarMetrica(row.metrica_id);
  }

  return row;
}

export async function eliminarResultadoService(id: string) {
  const metricaIds = await obtenerMetricasDeResultado(id);
  const r = await pool.query(
    `DELETE FROM resultados_campana WHERE id = $1 RETURNING metrica_id`,
    [id]
  );
  const primaryId = r.rows[0]?.metrica_id;
  const toSync = metricaIds.length ? metricaIds : primaryId ? [primaryId] : [];
  for (const mid of toSync) await sincronizarMetrica(mid);
}

export async function resumenPorCampanaService(metrica_id: string) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int          AS total_ventas,
       COALESCE(SUM(monto),0) AS total_ingresos,
       COALESCE(AVG(monto),0) AS ticket_promedio
     FROM resultados_campana
     WHERE metrica_id = $1`,
    [metrica_id]
  );
  return result.rows[0];
}
