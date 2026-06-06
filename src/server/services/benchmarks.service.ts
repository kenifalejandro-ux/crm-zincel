import { pool } from "../config/database";
import type { BenchmarkInput } from "../schemas/benchmarks.schema";

export async function listarBenchmarksService() {
  const r = await pool.query(`SELECT * FROM benchmark_sectores ORDER BY sector`);
  return r.rows;
}

export async function getBenchmarkPorSectorService(sector: string) {
  const r = await pool.query(`SELECT * FROM benchmark_sectores WHERE sector = $1`, [sector]);
  return r.rows[0] ?? null;
}

export async function getBenchmarkPorEmpresaService(empresa: string) {
  const r = await pool.query(
    `SELECT bs.* FROM benchmark_sectores bs
     INNER JOIN meta_cuentas mc ON mc.sector = bs.sector
     WHERE mc.empresa = $1
     LIMIT 1`,
    [empresa]
  );
  return r.rows[0] ?? null;
}

export async function crearBenchmarkService(input: BenchmarkInput) {
  const r = await pool.query(
    `INSERT INTO benchmark_sectores
      (sector, ctr_excelente, ctr_aceptable, cpc_excelente, cpc_aceptable,
       cpm_excelente, cpm_aceptable, cpl_excelente, cpl_aceptable,
       cpa_excelente, cpa_aceptable, roas_excelente, roas_aceptable,
       roi_excelente, roi_aceptable, fuente)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      input.sector,
      input.ctr_excelente  ?? null, input.ctr_aceptable  ?? null,
      input.cpc_excelente  ?? null, input.cpc_aceptable  ?? null,
      input.cpm_excelente  ?? null, input.cpm_aceptable  ?? null,
      input.cpl_excelente  ?? null, input.cpl_aceptable  ?? null,
      input.cpa_excelente  ?? null, input.cpa_aceptable  ?? null,
      input.roas_excelente ?? null, input.roas_aceptable ?? null,
      input.roi_excelente  ?? null, input.roi_aceptable  ?? null,
      input.fuente         ?? null,
    ]
  );
  return r.rows[0];
}

export async function actualizarBenchmarkService(id: string, input: Partial<BenchmarkInput>) {
  const campos = Object.keys(input).filter(k => input[k as keyof BenchmarkInput] !== undefined);
  if (!campos.length) throw new Error("Sin campos para actualizar");
  const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const vals = campos.map(k => (input as any)[k]);
  const r = await pool.query(
    `UPDATE benchmark_sectores SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  return r.rows[0];
}

export async function eliminarBenchmarkService(id: string) {
  await pool.query(`DELETE FROM benchmark_sectores WHERE id = $1`, [id]);
}

export async function updateEmpresaSectorService(empresa: string, sector: string) {
  await pool.query(
    `UPDATE meta_cuentas SET sector = $2 WHERE empresa ILIKE $1`,
    [empresa, sector || null]
  );
}
