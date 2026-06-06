/** server/services/resultados.service.ts */

import { pool } from "../config/database";
import type { ResultadoInput } from "../schemas/resultados.schema";

export async function crearResultadoService(input: ResultadoInput) {
  const result = await pool.query(
    `INSERT INTO resultados_campana
      (empresa, metrica_id, campana_nombre, proyecto, monto, costo_venta, fecha_venta, prospecto_id, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.empresa,
      input.metrica_id,
      input.campana_nombre,
      input.proyecto ?? null,
      input.monto,
      input.costo_venta ?? 0,
      input.fecha_venta,
      input.prospecto_id ?? null,
      input.notas ?? null,
    ]
  );
  await sincronizarMetrica(input.metrica_id);
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
    `SELECT r.*,
            p.nombre_contacto AS prospecto_nombre
       FROM resultados_campana r
       LEFT JOIN prospectos p ON p.id = r.prospecto_id
       ${where}
       ORDER BY r.fecha_venta DESC`,
    vals
  );
  return result.rows;
}

export async function actualizarResultadoService(id: string, body: Partial<ResultadoInput>) {
  const campos = Object.keys(body).filter((k) => k !== "metrica_id");
  if (!campos.length) throw new Error("Sin campos para actualizar");
  const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const vals = campos.map((k) => (body as any)[k]);
  const result = await pool.query(
    `UPDATE resultados_campana SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  const row = result.rows[0];
  if (row?.metrica_id) await sincronizarMetrica(row.metrica_id);
  return row;
}

export async function eliminarResultadoService(id: string) {
  const r = await pool.query(
    `DELETE FROM resultados_campana WHERE id = $1 RETURNING metrica_id`, [id]
  );
  const metrica_id = r.rows[0]?.metrica_id;
  if (metrica_id) await sincronizarMetrica(metrica_id);
}

async function sincronizarMetrica(metrica_id: string) {
  await pool.query(
    `UPDATE campana_metricas cm
     SET
       ingresos    = r.total_ingresos,
       costo_total = cm.gasto + r.total_costos,
       roas = CASE
         WHEN cm.gasto > 0
         THEN ROUND(r.total_ingresos / cm.gasto, 2)
         ELSE 0 END,
       roi = CASE
         WHEN (cm.gasto + r.total_costos) > 0
         THEN ROUND(
           (r.total_ingresos - (cm.gasto + r.total_costos))
           / (cm.gasto + r.total_costos) * 100, 2
         ) ELSE 0 END
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

