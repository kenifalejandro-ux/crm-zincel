/** src/server/services/finanzas.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import { fechaHoy } from "../shared/utils/date.util";
import type {
  CrearIngresoInput, ActualizarIngresoInput,
  CrearEgresoInput, ActualizarEgresoInput,
  CrearPrestamoInput, ActualizarPrestamoInput,
} from "../schemas/finanzas.schema";

// ── INGRESOS ──────────────────────────────────────────────────

export async function crearIngresoService(input: CrearIngresoInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO ingresos
       (prospecto_id, empresa, descripcion, tipo_servicio, monto_total, adelanto,
        moneda, tipo_cambio, estado, fecha, fecha_vencimiento, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      input.prospecto_id ?? null,
      input.empresa,
      input.descripcion,
      input.tipo_servicio ?? "otro",
      input.monto_total,
      input.adelanto ?? 0,
      input.moneda ?? "PEN",
      input.moneda === "USD" ? (input.tipo_cambio ?? 1) : 1,
      input.estado ?? "por_cobrar",
      input.fecha,
      input.fecha_vencimiento ?? null,
      input.notas ?? null,
      usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Ingreso creado");
  return result.rows[0];
}

export async function obtenerIngresosService(filtros: {
  desde?: string;
  hasta?: string;
  estado?: string;
  mes?: number;
  anio?: number;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.desde)  { condiciones.push(`i.fecha >= $${idx++}`); valores.push(filtros.desde); }
  if (filtros.hasta)  { condiciones.push(`i.fecha <= $${idx++}`); valores.push(filtros.hasta); }
  if (filtros.estado) { condiciones.push(`i.estado = $${idx++}`); valores.push(filtros.estado); }
  if (filtros.mes && filtros.anio) {
    condiciones.push(`EXTRACT(MONTH FROM i.fecha) = $${idx++}`); valores.push(filtros.mes);
    condiciones.push(`EXTRACT(YEAR  FROM i.fecha) = $${idx++}`); valores.push(filtros.anio);
  } else if (filtros.anio) {
    condiciones.push(`EXTRACT(YEAR FROM i.fecha) = $${idx++}`); valores.push(filtros.anio);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT i.*, p.empresa AS empresa_prospecto
     FROM ingresos i
     LEFT JOIN prospectos p ON p.id = i.prospecto_id
     ${where}
     ORDER BY i.fecha DESC`,
    valores
  );

  // Marcar vencidos automáticamente en la respuesta (sin alterar BD)
  const hoy = fechaHoy();
  return result.rows.map((row) => {
    if (
      row.estado !== "cobrado" &&
      row.fecha_vencimiento &&
      row.fecha_vencimiento < hoy
    ) {
      return { ...row, estado: "vencido" };
    }
    return row;
  });
}

export async function actualizarIngresoService(id: string, input: ActualizarIngresoInput) {
  const campos = Object.keys(input).filter((k) => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");
  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const result = await pool.query(
    `UPDATE ingresos SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...campos.map((c) => (input as any)[c])]
  );
  if (result.rowCount === 0) throw new Error("Ingreso no encontrado");
  return result.rows[0];
}

export async function eliminarIngresoService(id: string) {
  const result = await pool.query(`DELETE FROM ingresos WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) throw new Error("Ingreso no encontrado");
  return { eliminado: true };
}

export async function eliminarIngresosMasivoService(ids: string[]) {
  if (!ids.length) return 0;
  const result = await pool.query(
    `DELETE FROM ingresos WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  logger.info({ eliminados: result.rowCount }, "Ingresos eliminados masivamente");
  return result.rowCount;
}

// ── EGRESOS ───────────────────────────────────────────────────

export async function crearEgresoService(input: CrearEgresoInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO egresos
       (categoria, descripcion, proveedor, monto, moneda, tipo_cambio, frecuencia, estado, fecha, fecha_vencimiento, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      input.categoria,
      input.descripcion,
      input.proveedor ?? null,
      input.monto,
      input.moneda ?? "PEN",
      input.moneda === "USD" ? (input.tipo_cambio ?? 1) : 1,
      input.frecuencia ?? "unico",
      input.estado ?? "pendiente",
      input.fecha,
      input.fecha_vencimiento ?? null,
      input.notas ?? null,
      usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Egreso creado");
  return result.rows[0];
}

export async function obtenerEgresosService(filtros: {
  categoria?: string;
  estado?: string;
  mes?: number;
  anio?: number;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.categoria) { condiciones.push(`categoria = $${idx++}`); valores.push(filtros.categoria); }
  if (filtros.estado)    { condiciones.push(`estado = $${idx++}`);    valores.push(filtros.estado); }
  if (filtros.mes && filtros.anio) {
    condiciones.push(`EXTRACT(MONTH FROM fecha) = $${idx++}`); valores.push(filtros.mes);
    condiciones.push(`EXTRACT(YEAR  FROM fecha) = $${idx++}`); valores.push(filtros.anio);
  } else if (filtros.anio) {
    condiciones.push(`EXTRACT(YEAR FROM fecha) = $${idx++}`); valores.push(filtros.anio);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM egresos ${where} ORDER BY fecha DESC`,
    valores
  );
  return result.rows;
}

export async function actualizarEgresoService(id: string, input: ActualizarEgresoInput) {
  const campos = Object.keys(input).filter((k) => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");
  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const result = await pool.query(
    `UPDATE egresos SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...campos.map((c) => (input as any)[c])]
  );
  if (result.rowCount === 0) throw new Error("Egreso no encontrado");
  return result.rows[0];
}

export async function eliminarEgresoService(id: string) {
  const result = await pool.query(`DELETE FROM egresos WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) throw new Error("Egreso no encontrado");
  return { eliminado: true };
}

export async function eliminarEgresosMasivoService(ids: string[]) {
  if (!ids.length) return 0;
  const result = await pool.query(
    `DELETE FROM egresos WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  logger.info({ eliminados: result.rowCount }, "Egresos eliminados masivamente");
  return result.rowCount;
}

// ── RESUMEN FINANCIERO ─────────────────────────────────────────

export async function resumenFinancieroService(filtros: { mes?: number; anio?: number; tipo_cambio?: number } = {}) {
  const mes  = filtros.mes  ?? new Date().getMonth() + 1;
  const anio = filtros.anio ?? new Date().getFullYear();

  // Usa el TC histórico guardado en cada registro (tipo_cambio = 1 para PEN)
  const toPEN = (col: string) =>
    `CASE WHEN moneda = 'USD' THEN ${col} * tipo_cambio ELSE ${col} END`;

  const [ingresos, egresos, porCobrar, porServicio, porCategoria, flujoMensual, pasivos] = await Promise.all([

    // Totales de ingresos del período (convertidos a PEN)
    pool.query(`
      SELECT
        COALESCE(SUM(${toPEN("monto_total")}), 0)                                                AS total_acordado,
        COALESCE(SUM(${toPEN("adelanto")}), 0)                                                   AS total_cobrado,
        COALESCE(SUM(${toPEN("saldo_pendiente")}), 0)                                            AS total_por_cobrar,
        COALESCE(SUM(${toPEN("monto_total")}) FILTER (WHERE estado = 'cobrado'), 0)              AS cobrado_completo,
        COUNT(*)                                                                                   AS cantidad
      FROM ingresos
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
    `, [mes, anio]),

    // Totales de egresos del período (convertidos a PEN)
    pool.query(`
      SELECT
        COALESCE(SUM(${toPEN("monto")}), 0) AS total_egresos,
        COUNT(*)                              AS cantidad
      FROM egresos
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
    `, [mes, anio]),

    // Por cobrar acumulado (convertido a PEN)
    pool.query(`
      SELECT COALESCE(SUM(${toPEN("saldo_pendiente")}), 0) AS por_cobrar_total
      FROM ingresos
      WHERE estado IN ('por_cobrar', 'cobrado_parcial', 'vencido')
    `),

    // Ingresos por tipo de servicio (convertidos a PEN)
    pool.query(`
      SELECT tipo_servicio, COALESCE(SUM(${toPEN("monto_total")}), 0) AS total
      FROM ingresos
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
      GROUP BY tipo_servicio
      ORDER BY total DESC
    `, [mes, anio]),

    // Egresos por categoría (convertidos a PEN)
    pool.query(`
      SELECT categoria, COALESCE(SUM(${toPEN("monto")}), 0) AS total
      FROM egresos
      WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
      GROUP BY categoria
      ORDER BY total DESC
    `, [mes, anio]),

    // Flujo mensual últimos 6 meses (convertido a PEN)
    pool.query(`
      WITH meses AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          '1 month'
        ) AS mes
      ),
      ing AS (
        SELECT date_trunc('month', fecha) AS mes,
               SUM(CASE WHEN moneda = 'USD' THEN adelanto * tipo_cambio ELSE adelanto END) AS total
        FROM ingresos GROUP BY 1
      ),
      egr AS (
        SELECT date_trunc('month', fecha) AS mes,
               SUM(CASE WHEN moneda = 'USD' THEN monto * tipo_cambio ELSE monto END) AS total
        FROM egresos GROUP BY 1
      )
      SELECT
        TO_CHAR(m.mes, 'Mon YY') AS etiqueta,
        COALESCE(i.total, 0)     AS ingresos,
        COALESCE(e.total, 0)     AS egresos,
        COALESCE(i.total, 0) - COALESCE(e.total, 0) AS utilidad
      FROM meses m
      LEFT JOIN ing i ON i.mes = m.mes
      LEFT JOIN egr e ON e.mes = m.mes
      ORDER BY m.mes ASC
    `),

    // Pasivos: préstamos pendientes (por_pagar + vencido), convertidos a PEN con TC histórico
    pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN moneda = 'USD' THEN monto * tipo_cambio ELSE monto END)
          FILTER (WHERE estado IN ('por_pagar','vencido')), 0)  AS total_por_pagar,
        COALESCE(SUM(CASE WHEN moneda = 'USD' THEN monto * tipo_cambio ELSE monto END)
          FILTER (WHERE estado = 'vencido'), 0)                 AS total_vencido,
        COUNT(*) FILTER (WHERE estado IN ('por_pagar','vencido')) AS cantidad_pendientes,
        COUNT(*) FILTER (WHERE estado = 'vencido')               AS cantidad_vencidos
      FROM prestamos
    `),
  ]);

  const totalCobrado  = Number(ingresos.rows[0].total_cobrado);
  const totalEgresos  = Number(egresos.rows[0].total_egresos);
  const totalPasivos  = Number(pasivos.rows[0].total_por_pagar);

  return {
    periodo: { mes, anio },
    ingresos: {
      ...ingresos.rows[0],
      utilidad_neta: totalCobrado - totalEgresos,
    },
    egresos:       egresos.rows[0],
    por_cobrar:    porCobrar.rows[0],
    pasivos:       { ...pasivos.rows[0], posicion_real: totalCobrado - totalEgresos - totalPasivos },
    por_servicio:  porServicio.rows,
    por_categoria: porCategoria.rows,
    flujo_mensual: flujoMensual.rows,
  };
}

// ── PRÉSTAMOS ─────────────────────────────────────────────────

export async function crearPrestamoService(input: CrearPrestamoInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO prestamos
       (categoria, descripcion, prestamista, monto, moneda, tipo_cambio, estado,
        fecha, fecha_vencimiento, fecha_pago, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      input.categoria ?? "otro",
      input.descripcion,
      input.prestamista ?? null,
      input.monto,
      input.moneda ?? "PEN",
      input.moneda === "USD" ? (input.tipo_cambio ?? 1) : 1,
      input.estado ?? "por_pagar",
      input.fecha,
      input.fecha_vencimiento ?? null,
      input.fecha_pago ?? null,
      input.notas ?? null,
      usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Préstamo creado");
  return result.rows[0];
}

export async function obtenerPrestamosService(filtros: { estado?: string; categoria?: string } = {}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;
  if (filtros.estado)    { condiciones.push(`estado = $${idx++}`);    valores.push(filtros.estado); }
  if (filtros.categoria) { condiciones.push(`categoria = $${idx++}`); valores.push(filtros.categoria); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM prestamos ${where} ORDER BY fecha DESC`,
    valores
  );
  // Auto-marcar vencidos en la respuesta
  const hoy = fechaHoy();
  return result.rows.map((row) => {
    if (row.estado === "por_pagar" && row.fecha_vencimiento && row.fecha_vencimiento < hoy) {
      return { ...row, estado: "vencido" };
    }
    return row;
  });
}

export async function actualizarPrestamoService(id: string, input: ActualizarPrestamoInput) {
  const campos = Object.keys(input).filter((k) => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");
  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const result = await pool.query(
    `UPDATE prestamos SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...campos.map((c) => (input as any)[c])]
  );
  if (result.rowCount === 0) throw new Error("Préstamo no encontrado");
  return result.rows[0];
}

export async function eliminarPrestamoService(id: string) {
  const result = await pool.query(`DELETE FROM prestamos WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) throw new Error("Préstamo no encontrado");
  return { eliminado: true };
}

export async function eliminarPrestamosMasivoService(ids: string[]) {
  if (!ids.length) return 0;
  const result = await pool.query(
    `DELETE FROM prestamos WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  logger.info({ eliminados: result.rowCount }, "Préstamos eliminados masivamente");
  return result.rowCount;
}

// Resumen simplificado para DashboardPage
export async function resumenFinancieroDashboardService() {
  const result = await pool.query(`
    SELECT
      COALESCE(SUM(adelanto) FILTER (
        WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND   EXTRACT(YEAR  FROM fecha) = EXTRACT(YEAR  FROM CURRENT_DATE)
      ), 0) AS ingresos_mes,
      COALESCE(SUM(adelanto) FILTER (
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
      ), 0) AS ingresos_anio
    FROM ingresos
  `);
  return result.rows[0];
}
