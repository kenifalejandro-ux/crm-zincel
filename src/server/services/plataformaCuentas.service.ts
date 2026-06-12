import { pool } from "../config/database";
import type { PlataformaCuentaInput } from "../schemas/plataformaCuentas.schema";

export async function listarPlataformaCuentas() {
  const result = await pool.query(
    `SELECT id, empresa, plataforma, account_id, activo, notas, token_vence_en,
            ultimo_sync, sync_error, sync_automatico, creado_en, actualizado_en
     FROM plataforma_cuentas ORDER BY empresa ASC, plataforma ASC`
  );
  return result.rows;
}

export async function obtenerCuentaPorEmpresaYPlataforma(empresa: string, plataforma: string) {
  const result = await pool.query(
    `SELECT * FROM plataforma_cuentas
     WHERE empresa ILIKE $1 AND plataforma = $2 AND activo = true
     LIMIT 1`,
    [empresa, plataforma]
  );
  return result.rows[0] ?? null;
}

export async function obtenerPlataformasDeEmpresa(empresa: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT plataforma FROM plataforma_cuentas
     WHERE empresa ILIKE $1 AND activo = true`,
    [empresa]
  );
  return result.rows.map((r: any) => r.plataforma);
}

export async function listarEmpresasConCuentas(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT empresa FROM plataforma_cuentas WHERE activo = true ORDER BY empresa ASC`
  );
  return result.rows.map((r: any) => r.empresa);
}

export async function crearPlataformaCuenta(input: PlataformaCuentaInput) {
  const result = await pool.query(
    `INSERT INTO plataforma_cuentas (empresa, plataforma, account_id, access_token, activo, notas, token_vence_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, empresa, plataforma, account_id, activo, notas, token_vence_en, creado_en`,
    [input.empresa, input.plataforma, input.account_id, input.access_token, input.activo, input.notas ?? null, input.token_vence_en ?? null]
  );
  return result.rows[0];
}

export async function actualizarPlataformaCuenta(id: string, input: Partial<PlataformaCuentaInput>) {
  const campos  = Object.keys(input) as (keyof PlataformaCuentaInput)[];
  if (!campos.length) return null;

  const sets    = campos.map((c, i) => `${String(c)} = $${i + 1}`).join(", ");
  const valores = campos.map((c) => input[c]);

  const result = await pool.query(
    `UPDATE plataforma_cuentas SET ${sets}, actualizado_en = NOW()
     WHERE id = $${campos.length + 1}
     RETURNING id, empresa, plataforma, account_id, activo, notas, token_vence_en, actualizado_en`,
    [...valores, id]
  );
  return result.rows[0] ?? null;
}

export async function eliminarPlataformaCuenta(id: string) {
  await pool.query(`DELETE FROM plataforma_cuentas WHERE id = $1`, [id]);
}

export async function registrarSync(empresa: string, plataforma: string, error?: string | null) {
  await pool.query(
    `UPDATE plataforma_cuentas
     SET ultimo_sync = NOW(), sync_error = $3, actualizado_en = NOW()
     WHERE empresa ILIKE $1 AND plataforma = $2`,
    [empresa, plataforma, error ?? null]
  );
}

export async function listarCuentasAutoSync(): Promise<{ id: string; empresa: string; plataforma: string }[]> {
  const result = await pool.query(
    `SELECT id, empresa, plataforma FROM plataforma_cuentas
     WHERE activo = true AND COALESCE(sync_automatico, true) = true
     ORDER BY empresa ASC, plataforma ASC`
  );
  return result.rows;
}
