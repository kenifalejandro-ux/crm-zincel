/** src/server/services/configuracion.service.ts */

import axios from "axios";
import { pool } from "../config/database";

const CLAVE_TC = "tipo_cambio_usd_pen";

export async function getTipoCambioService(): Promise<{ valor: number; actualizado_en: string }> {
  const result = await pool.query(
    `SELECT valor, actualizado_en FROM configuracion WHERE clave = $1`,
    [CLAVE_TC]
  );
  if (result.rowCount === 0) return { valor: 3.75, actualizado_en: new Date().toISOString() };
  return {
    valor:          parseFloat(result.rows[0].valor),
    actualizado_en: result.rows[0].actualizado_en,
  };
}

export async function guardarTipoCambioService(valor: number): Promise<{ valor: number; actualizado_en: string }> {
  const result = await pool.query(
    `INSERT INTO configuracion (clave, valor, actualizado_en)
     VALUES ($1, $2, NOW())
     ON CONFLICT (clave) DO UPDATE SET valor = $2, actualizado_en = NOW()
     RETURNING valor, actualizado_en`,
    [CLAVE_TC, String(valor)]
  );
  return {
    valor:          parseFloat(result.rows[0].valor),
    actualizado_en: result.rows[0].actualizado_en,
  };
}

export async function actualizarTipoCambioDesdeAPIService(): Promise<{ valor: number; actualizado_en: string }> {
  const { data } = await axios.get("https://open.er-api.com/v6/latest/USD", { timeout: 5000 });
  const pen = data?.rates?.PEN;
  if (!pen || typeof pen !== "number") throw new Error("No se pudo obtener el tipo de cambio");
  return guardarTipoCambioService(Math.round(pen * 100) / 100);
}
