import { pool } from "../config/database";
import type { MetaCuentaInput, MetaProyeccionInput } from "../schemas/metaCuentas.schema";

export async function listarMetaCuentas() {
  const result = await pool.query(
    `SELECT id, empresa, ad_account_id, activo, notas, sector, creado_en, actualizado_en
     FROM meta_cuentas ORDER BY empresa ASC`
  );
  return result.rows;
}

export async function obtenerMetaCuentaPorEmpresa(empresa: string) {
  const result = await pool.query(
    `SELECT * FROM meta_cuentas WHERE empresa ILIKE $1 AND activo = true LIMIT 1`,
    [empresa]
  );
  return result.rows[0] ?? null;
}

export async function crearMetaCuenta(input: MetaCuentaInput) {
  const result = await pool.query(
    `INSERT INTO meta_cuentas (empresa, ad_account_id, access_token, activo, notas)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, empresa, ad_account_id, activo, notas, creado_en`,
    [input.empresa, input.ad_account_id, input.access_token, input.activo, input.notas ?? null]
  );
  return result.rows[0];
}

export async function actualizarMetaCuenta(id: string, input: Partial<MetaCuentaInput>) {
  const campos = Object.keys(input) as (keyof MetaCuentaInput)[];
  if (!campos.length) return null;

  const sets   = campos.map((c, i) => `${String(c)} = $${i + 1}`).join(", ");
  const valores = campos.map((c) => input[c]);

  const result = await pool.query(
    `UPDATE meta_cuentas SET ${sets}, actualizado_en = NOW()
     WHERE id = $${campos.length + 1}
     RETURNING id, empresa, ad_account_id, activo, notas, actualizado_en`,
    [...valores, id]
  );
  return result.rows[0] ?? null;
}

export async function eliminarMetaCuenta(id: string) {
  await pool.query(`DELETE FROM meta_cuentas WHERE id = $1`, [id]);
}

export async function obtenerProyeccionConfig(empresa: string) {
  const { rows } = await pool.query(
    `SELECT empresa, cpl_umbral, fase_campana, vendedor_email, vendedor_whatsapp
     FROM meta_cuentas WHERE empresa ILIKE $1 LIMIT 1`,
    [empresa]
  );
  return rows[0] ?? null;
}

export async function guardarProyeccionConfig(input: MetaProyeccionInput) {
  const { rows } = await pool.query(
    `INSERT INTO meta_cuentas (empresa, ad_account_id, access_token, cpl_umbral, fase_campana, vendedor_email, vendedor_whatsapp)
     VALUES ($1, '', '', $2, $3, $4, $5)
     ON CONFLICT (empresa) DO UPDATE SET
       cpl_umbral          = EXCLUDED.cpl_umbral,
       fase_campana        = EXCLUDED.fase_campana,
       vendedor_email      = EXCLUDED.vendedor_email,
       vendedor_whatsapp   = EXCLUDED.vendedor_whatsapp,
       actualizado_en      = NOW()
     RETURNING empresa, cpl_umbral, fase_campana, vendedor_email, vendedor_whatsapp`,
    [input.empresa, input.cpl_umbral ?? null, input.fase_campana, input.vendedor_email ?? null, input.vendedor_whatsapp ?? null]
  );
  return rows[0];
}
