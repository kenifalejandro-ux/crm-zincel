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

// ── ANÁLISIS FINANCIERO (8 indicadores Vértice) ────────────────

export async function analisisFinancieroService() {
  const toPEN = (col: string) =>
    `CASE WHEN moneda = 'USD' THEN ${col} * tipo_cambio ELSE ${col} END`;

  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(${toPEN("adelanto")}), 0) AS total FROM ingresos`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("monto")}),   0) AS total FROM egresos   WHERE estado = 'pagado'`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("saldo_pendiente")}), 0) AS total FROM ingresos WHERE estado IN ('por_cobrar','cobrado_parcial','vencido')`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("monto")}), 0) AS total FROM egresos   WHERE estado = 'pendiente'`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("monto")}), 0) AS total FROM prestamos WHERE estado IN ('por_pagar','vencido')`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("adelanto")}), 0) AS total FROM ingresos WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)`),
    pool.query(`SELECT COALESCE(SUM(${toPEN("monto")}),   0) AS total FROM egresos   WHERE estado = 'pagado' AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)`),
  ]);

  const totalCobrado      = Number(r1.rows[0].total);
  const totalEgresosPag   = Number(r2.rows[0].total);
  const cxc               = Number(r3.rows[0].total);
  const pasivosCorrientes = Number(r4.rows[0].total);
  const prestamosPend     = Number(r5.rows[0].total);
  const ingresosAnio      = Number(r6.rows[0].total);
  const egresosAnio       = Number(r7.rows[0].total);

  const cajaYBancos       = totalCobrado - totalEgresosPag;
  const cajaPositiva      = Math.max(0, cajaYBancos);
  const activosCorrientes = cajaYBancos + cxc;
  const activosTotales    = activosCorrientes;
  const pasivosTotales    = pasivosCorrientes + prestamosPend;
  const patrimonio        = activosTotales - pasivosTotales;
  const utilidad          = ingresosAnio - egresosAnio;

  const safe = (num: number, den: number, fallback = 0) =>
    den !== 0 ? num / den : fallback;

  const liquidezCorriente       = safe(activosCorrientes, pasivosCorrientes, 999);
  const capitalTrabajo          = activosCorrientes - pasivosCorrientes;
  const endeudamiento           = safe(pasivosTotales, activosTotales) * 100;
  const deudaPatrimonio         = patrimonio > 0 ? safe(pasivosTotales, patrimonio) : null;
  const roe                     = patrimonio > 0 ? safe(utilidad, patrimonio) * 100 : null;
  const roa                     = activosTotales > 0 ? safe(utilidad, activosTotales) * 100 : null;
  const concentracionCxC        = safe(cxc, activosCorrientes) * 100;
  const disponibilidadInmediata = safe(cajaPositiva, pasivosCorrientes, 100) * 100;

  const clasifLiquidez = (v: number) =>
    v >= 1.5 ? "optimo" : v >= 1.0 ? "aceptable" : "critico";
  const clasifCapital  = (v: number) => v > 0 ? "optimo" : "critico";
  const clasifEndeud   = (v: number) => v < 50 ? "riesgo_bajo" : v <= 70 ? "moderado" : "riesgo_alto";
  const clasifDP       = (v: number | null) =>
    v === null ? "sin_datos" : v < 1 ? "riesgo_bajo" : v <= 2 ? "moderado" : "riesgo_alto";
  const clasifRoe      = (v: number | null) =>
    v === null ? "sin_datos" : v >= 20 ? "excelente" : v >= 10 ? "bueno" : "por_mejorar";
  const clasifRoa      = (v: number | null) =>
    v === null ? "sin_datos" : v >= 10 ? "excelente" : v >= 5 ? "bueno" : "por_mejorar";
  const clasifCxC      = (v: number) => v < 50 ? "riesgo_bajo" : v <= 70 ? "moderado" : "alto_riesgo";
  const clasifDisp     = (v: number) => v >= 30 ? "optimo" : v >= 20 ? "atencion" : "critico";

  const hallazgos: { tipo: "positivo" | "negativo"; texto: string }[] = [];

  if (liquidezCorriente >= 1.5)
    hallazgos.push({ tipo: "positivo", texto: "La liquidez corriente es óptima. La empresa puede cubrir sus obligaciones de corto plazo." });
  else if (liquidezCorriente < 1.0)
    hallazgos.push({ tipo: "negativo", texto: "Liquidez corriente crítica: los activos corrientes no cubren los pasivos de corto plazo." });

  if (cajaYBancos > 0)
    hallazgos.push({ tipo: "positivo", texto: "La empresa mantiene una posición de caja positiva." });
  else
    hallazgos.push({ tipo: "negativo", texto: "La posición de caja es negativa. Revisar el flujo operativo urgentemente." });

  if (roe !== null && roe >= 20)
    hallazgos.push({ tipo: "positivo", texto: `Excelente rentabilidad del patrimonio (ROE ${roe.toFixed(1)}%). Fuerte retorno para los socios.` });
  else if (roe !== null && roe < 10)
    hallazgos.push({ tipo: "negativo", texto: `Rentabilidad del patrimonio baja (ROE ${roe.toFixed(1)}%). Analizar eficiencia operativa.` });

  if (roa !== null && roa >= 10)
    hallazgos.push({ tipo: "positivo", texto: `Los activos generan una rentabilidad atractiva (ROA ${roa.toFixed(1)}%).` });

  if (concentracionCxC > 70)
    hallazgos.push({ tipo: "negativo", texto: `El ${concentracionCxC.toFixed(0)}% de los activos está concentrado en cuentas por cobrar, limitando el flujo de caja.` });

  if (endeudamiento > 70)
    hallazgos.push({ tipo: "negativo", texto: `Alto endeudamiento (${endeudamiento.toFixed(0)}%): más del 70% de los activos son financiados por terceros.` });

  if (disponibilidadInmediata < 20 && pasivosCorrientes > 0)
    hallazgos.push({ tipo: "negativo", texto: `Solo el ${disponibilidadInmediata.toFixed(0)}% de las obligaciones corrientes puede cubrirse con efectivo inmediato.` });

  if (patrimonio > 0 && pasivosTotales < patrimonio)
    hallazgos.push({ tipo: "positivo", texto: "Los fondos propios superan los pasivos totales. Estructura financiera sólida." });

  const negativos = hallazgos.filter(h => h.tipo === "negativo").length;
  const semaforo  = negativos >= 3 ? "critico" : negativos >= 1 ? "en_riesgo" : "estable";

  const recomendaciones: string[] = [];
  if (concentracionCxC > 70) {
    recomendaciones.push("Priorizar la recuperación de las cuentas por cobrar.");
    recomendaciones.push("Implementar una política de cobranza más agresiva.");
  }
  if (disponibilidadInmediata < 30 && pasivosCorrientes > 0)
    recomendaciones.push("Elaborar un flujo de caja proyectado para los próximos 3 meses.");
  if (prestamosPend > 0)
    recomendaciones.push("Revisar el calendario de obligaciones de préstamos.");
  recomendaciones.push("Mantener reservas de efectivo para fortalecer la posición financiera.");

  const totalActivos = activosCorrientes > 0 ? activosCorrientes : 1;

  return {
    fecha_analisis: new Date().toISOString(),
    resumen: {
      activos_totales:    activosTotales,
      pasivos_totales:    pasivosTotales,
      patrimonio,
      utilidad_ejercicio: utilidad,
      caja_bancos:        cajaYBancos,
      cuentas_por_cobrar: cxc,
    },
    composicion_activos: [
      { nombre: "Cuentas por Cobrar", valor: cxc,          porcentaje: (cxc / totalActivos) * 100,          color: "#27272a" },
      { nombre: "Caja y Bancos",      valor: cajaPositiva, porcentaje: (cajaPositiva / totalActivos) * 100, color: "#22c55e" },
    ].filter(c => c.valor > 0),
    indicadores: {
      liquidez_corriente:       { valor: liquidezCorriente,       estado: clasifLiquidez(liquidezCorriente) },
      capital_trabajo:          { valor: capitalTrabajo,          estado: clasifCapital(capitalTrabajo) },
      endeudamiento:            { valor: endeudamiento,           estado: clasifEndeud(endeudamiento) },
      deuda_patrimonio:         { valor: deudaPatrimonio,         estado: clasifDP(deudaPatrimonio) },
      roe:                      { valor: roe,                     estado: clasifRoe(roe) },
      roa:                      { valor: roa,                     estado: clasifRoa(roa) },
      concentracion_cxc:        { valor: concentracionCxC,        estado: clasifCxC(concentracionCxC) },
      disponibilidad_inmediata: { valor: disponibilidadInmediata, estado: clasifDisp(disponibilidadInmediata) },
    },
    hallazgos,
    recomendaciones,
    semaforo,
  };
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
