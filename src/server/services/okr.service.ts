/** src/server/services/okr.service.ts */

import { pool } from "../config/database";

type TipoMetrica =
  | "nuevos_clientes"
  | "ingresos_facturados"
  | "propuestas_enviadas"
  | "tasa_cierre"
  | "prospectos_calificados"
  | "reuniones_realizadas"
  | "manual";

// ─── Rango de fechas del trimestre ─────────────────────────────────────────────
function trimestreRango(trimestre: number, anio: number) {
  const inicio = [`${anio}-01-01`, `${anio}-04-01`, `${anio}-07-01`, `${anio}-10-01`][trimestre - 1];
  const fin    = [`${anio}-03-31`, `${anio}-06-30`, `${anio}-09-30`, `${anio}-12-31`][trimestre - 1];
  return { inicio, fin };
}

// ─── Calcula valor real desde CRM ─────────────────────────────────────────────
async function calcularValorReal(
  tipo: TipoMetrica,
  inicio: string,
  fin: string,
  valorActual: number,
): Promise<number> {
  if (tipo === "manual") return valorActual;

  // Nuevos clientes = prospectos únicos con propuesta cerrada ganada en el trimestre
  if (tipo === "nuevos_clientes") {
    const r = await pool.query(
      `SELECT COUNT(DISTINCT prospecto_id)::int AS n
       FROM propuestas
       WHERE estado = 'cerrada_ganada'
         AND COALESCE(fecha_cierre, fecha_propuesta) BETWEEN $1 AND $2`,
      [inicio, fin],
    );
    return r.rows[0].n;
  }

  // Ingresos facturados = suma PEN de propuestas cerradas ganadas
  if (tipo === "ingresos_facturados") {
    const r = await pool.query(
      `SELECT COALESCE(SUM(
        CASE WHEN moneda = 'USD'
             THEN COALESCE(monto_cerrado, monto_propuesto) * tipo_cambio
             ELSE COALESCE(monto_cerrado, monto_propuesto)
        END
      ), 0)::float AS total
      FROM propuestas
      WHERE estado = 'cerrada_ganada'
        AND COALESCE(fecha_cierre, fecha_propuesta) BETWEEN $1 AND $2`,
      [inicio, fin],
    );
    return r.rows[0].total;
  }

  // Propuestas enviadas = todas las propuestas creadas en el trimestre
  if (tipo === "propuestas_enviadas") {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM propuestas WHERE fecha_propuesta BETWEEN $1 AND $2`,
      [inicio, fin],
    );
    return r.rows[0].n;
  }

  // Tasa de cierre = cerradas_ganadas / (cerradas_ganadas + cerradas_perdidas) × 100
  if (tipo === "tasa_cierre") {
    const r = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE estado = 'cerrada_ganada')::float  AS ganadas,
        COUNT(*) FILTER (WHERE estado IN ('cerrada_ganada','cerrada_perdida','vencida'))::float AS total
       FROM propuestas
       WHERE COALESCE(fecha_cierre, fecha_propuesta) BETWEEN $1 AND $2`,
      [inicio, fin],
    );
    const { ganadas, total } = r.rows[0];
    return total > 0 ? Math.round((ganadas / total) * 100) : 0;
  }

  // Prospectos calificados = leads con estado de interés que tuvieron contacto en el trimestre
  if (tipo === "prospectos_calificados") {
    const r = await pool.query(
      `SELECT COUNT(DISTINCT p.id)::int AS n
       FROM prospectos p
       WHERE p.estado_lead IN ('interesado', 'solicita_informacion', 'volver_a_llamar')
         AND EXISTS (
           SELECT 1 FROM llamadas l
           WHERE l.prospecto_id = p.id
             AND l.fecha::date BETWEEN $1 AND $2
         )`,
      [inicio, fin],
    );
    return r.rows[0].n;
  }

  // Reuniones realizadas = reuniones con estado realizada en el trimestre
  if (tipo === "reuniones_realizadas") {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM reuniones
       WHERE estado = 'realizada' AND fecha_hora::date BETWEEN $1 AND $2`,
      [inicio, fin],
    );
    return r.rows[0].n;
  }

  return 0;
}

// ─── LIST ──────────────────────────────────────────────────────────────────────
export async function listOkrsService() {
  const [okrsRes, krsRes] = await Promise.all([
    pool.query(`SELECT * FROM okrs WHERE activo = true ORDER BY anio DESC, trimestre DESC, creado_en DESC`),
    pool.query(`SELECT * FROM key_results ORDER BY creado_en ASC`),
  ]);

  const krsMap = new Map<string, any[]>();
  for (const kr of krsRes.rows) {
    const arr = krsMap.get(kr.okr_id) ?? [];
    arr.push(kr);
    krsMap.set(kr.okr_id, arr);
  }

  const okrs = await Promise.all(
    okrsRes.rows.map(async (okr) => {
      const { inicio, fin } = trimestreRango(okr.trimestre, okr.anio);
      const krs = krsMap.get(okr.id) ?? [];

      const krsConProgreso = await Promise.all(
        krs.map(async (kr) => {
          const valorReal = await calcularValorReal(
            kr.tipo_metrica,
            inicio, fin,
            parseFloat(kr.valor_actual),
          );
          const pct = kr.valor_objetivo > 0
            ? Math.min(100, Math.round((valorReal / parseFloat(kr.valor_objetivo)) * 100))
            : 0;
          return { ...kr, valor_real: valorReal, progreso_pct: pct };
        }),
      );

      const progresoTotal = krsConProgreso.length > 0
        ? Math.round(krsConProgreso.reduce((s, kr) => s + kr.progreso_pct, 0) / krsConProgreso.length)
        : 0;

      const estado =
        progresoTotal >= 70 ? "encamino" :
        progresoTotal >= 35 ? "riesgo"   : "critico";

      return { ...okr, key_results: krsConProgreso, progreso_total: progresoTotal, estado };
    }),
  );

  return okrs;
}

// ─── CREATE OKR ───────────────────────────────────────────────────────────────
export async function createOkrService(data: {
  titulo: string;
  descripcion?: string;
  trimestre: number;
  anio: number;
}) {
  const r = await pool.query(
    `INSERT INTO okrs (titulo, descripcion, trimestre, anio)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.titulo, data.descripcion ?? null, data.trimestre, data.anio],
  );
  return { ...r.rows[0], key_results: [], progreso_total: 0, estado: "critico" };
}

// ─── UPDATE OKR ───────────────────────────────────────────────────────────────
export async function updateOkrService(id: string, data: {
  titulo?: string;
  descripcion?: string;
  trimestre?: number;
  anio?: number;
}) {
  const r = await pool.query(
    `UPDATE okrs
     SET titulo      = COALESCE($2, titulo),
         descripcion = COALESCE($3, descripcion),
         trimestre   = COALESCE($4, trimestre),
         anio        = COALESCE($5, anio)
     WHERE id = $1 RETURNING *`,
    [id, data.titulo ?? null, data.descripcion ?? null, data.trimestre ?? null, data.anio ?? null],
  );
  return r.rows[0];
}

// ─── DELETE OKR (soft) ────────────────────────────────────────────────────────
export async function deleteOkrService(id: string) {
  await pool.query(`UPDATE okrs SET activo = false WHERE id = $1`, [id]);
}

// ─── ADD KEY RESULT ───────────────────────────────────────────────────────────
export async function addKeyResultService(okrId: string, data: {
  titulo: string;
  tipo_metrica: TipoMetrica;
  valor_objetivo: number;
  valor_actual?: number;
}) {
  const r = await pool.query(
    `INSERT INTO key_results (okr_id, titulo, tipo_metrica, valor_objetivo, valor_actual)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [okrId, data.titulo, data.tipo_metrica, data.valor_objetivo, data.valor_actual ?? 0],
  );
  return r.rows[0];
}

// ─── UPDATE KEY RESULT ────────────────────────────────────────────────────────
export async function updateKeyResultService(krId: string, data: {
  titulo?: string;
  valor_objetivo?: number;
  valor_actual?: number;
}) {
  const r = await pool.query(
    `UPDATE key_results
     SET titulo         = COALESCE($2, titulo),
         valor_objetivo = COALESCE($3, valor_objetivo),
         valor_actual   = COALESCE($4, valor_actual)
     WHERE id = $1 RETURNING *`,
    [krId, data.titulo ?? null, data.valor_objetivo ?? null, data.valor_actual ?? null],
  );
  return r.rows[0];
}

// ─── DELETE KEY RESULT ────────────────────────────────────────────────────────
export async function deleteKeyResultService(krId: string) {
  await pool.query(`DELETE FROM key_results WHERE id = $1`, [krId]);
}
