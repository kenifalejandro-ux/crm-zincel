/** src/server/services/analisisEmpresas.service.ts */

import { pool } from "../config/database";

// ── TIPOS LOCALES ──────────────────────────────────────────────

interface PeriodoRow {
  id: string;
  empresa_id: string;
  periodo: string;
  fecha_periodo: string;
  caja_bancos: number;
  cuentas_por_cobrar: number;
  otros_activos_corrientes: number;
  activo_fijo: number;
  otros_activos_no_corrientes: number;
  pasivos_corrientes: number;
  pasivos_no_corrientes: number;
  patrimonio: number;
  utilidad_ejercicio: number;
  ventas_netas: number;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

// ── HELPERS ────────────────────────────────────────────────────

function calcularIndicadores(p: PeriodoRow) {
  const activosCorrientes =
    Number(p.caja_bancos) +
    Number(p.cuentas_por_cobrar) +
    Number(p.otros_activos_corrientes);

  const activosTotales =
    activosCorrientes +
    Number(p.activo_fijo) +
    Number(p.otros_activos_no_corrientes);

  const pasivosTotales =
    Number(p.pasivos_corrientes) + Number(p.pasivos_no_corrientes);

  const patrimonio         = Number(p.patrimonio);
  const utilidad           = Number(p.utilidad_ejercicio);
  const pasivosCorrientes  = Number(p.pasivos_corrientes);
  const cxc                = Number(p.cuentas_por_cobrar);
  const caja               = Number(p.caja_bancos);
  const ventas             = Number(p.ventas_netas);

  const safe = (num: number, den: number, fallback = 0) =>
    den !== 0 ? num / den : fallback;

  const liquidezCorriente       = pasivosCorrientes > 0 ? safe(activosCorrientes, pasivosCorrientes) : 999;
  const capitalTrabajo          = activosCorrientes - pasivosCorrientes;
  const endeudamiento           = safe(pasivosTotales, activosTotales) * 100;
  const deudaPatrimonio         = patrimonio > 0 ? safe(pasivosTotales, patrimonio) : null;
  const roe                     = patrimonio > 0 ? safe(utilidad, patrimonio) * 100 : null;
  const roa                     = activosTotales > 0 ? safe(utilidad, activosTotales) * 100 : null;
  const margenNeto              = ventas > 0 ? safe(utilidad, ventas) * 100 : null;
  const concentracionCxC        = activosCorrientes > 0 ? safe(cxc, activosCorrientes) * 100 : 0;
  const disponibilidadInmediata = pasivosCorrientes > 0 ? safe(Math.max(0, caja), pasivosCorrientes) * 100 : 100;

  // Clasificadores
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
  const clasifMargen   = (v: number | null) =>
    v === null ? "sin_datos" : v >= 20 ? "excelente" : v >= 10 ? "bueno" : "por_mejorar";

  // Gauge pct (0-1): qué tan "bueno" es el indicador
  const gaugePct = {
    liquidez_corriente:       Math.min(1, liquidezCorriente / 3),
    capital_trabajo:          capitalTrabajo > 0 ? Math.min(1, 0.5 + capitalTrabajo / (activosTotales || 1) * 0.5) : Math.max(0, 0.5 + capitalTrabajo / (activosTotales || 1) * 0.5),
    endeudamiento:            Math.max(0, 1 - endeudamiento / 100),
    deuda_patrimonio:         deudaPatrimonio !== null ? Math.max(0, 1 - deudaPatrimonio / 4) : 0,
    roe:                      roe !== null ? Math.min(1, Math.max(0, roe / 50)) : 0,
    roa:                      roa !== null ? Math.min(1, Math.max(0, roa / 30)) : 0,
    concentracion_cxc:        Math.max(0, 1 - concentracionCxC / 100),
    disponibilidad_inmediata: Math.min(1, disponibilidadInmediata / 100),
  };

  const hallazgos: { tipo: "positivo" | "negativo"; texto: string }[] = [];

  if (liquidezCorriente >= 1.5)
    hallazgos.push({ tipo: "positivo", texto: "Liquidez corriente óptima. La empresa puede cubrir sus deudas de corto plazo." });
  else if (liquidezCorriente < 1.0)
    hallazgos.push({ tipo: "negativo", texto: "Liquidez corriente crítica: los activos no cubren los pasivos de corto plazo." });

  if (caja > 0)
    hallazgos.push({ tipo: "positivo", texto: "La empresa mantiene una posición de caja positiva." });
  else
    hallazgos.push({ tipo: "negativo", texto: "La posición de caja es negativa o nula. Revisar el flujo operativo." });

  if (roe !== null && roe >= 20)
    hallazgos.push({ tipo: "positivo", texto: `Excelente rentabilidad del patrimonio (ROE ${roe.toFixed(1)}%). Fuerte retorno para los socios.` });
  else if (roe !== null && roe < 10 && roe !== 0)
    hallazgos.push({ tipo: "negativo", texto: `Rentabilidad del patrimonio baja (ROE ${roe.toFixed(1)}%). Analizar eficiencia operativa.` });

  if (roa !== null && roa >= 10)
    hallazgos.push({ tipo: "positivo", texto: `Los activos generan rentabilidad atractiva (ROA ${roa.toFixed(1)}%).` });

  if (concentracionCxC > 70)
    hallazgos.push({ tipo: "negativo", texto: `El ${concentracionCxC.toFixed(0)}% de los activos corrientes son cuentas por cobrar — riesgo de flujo de caja.` });

  if (endeudamiento > 70)
    hallazgos.push({ tipo: "negativo", texto: `Alto endeudamiento (${endeudamiento.toFixed(0)}%): más del 70% de los activos financiados por terceros.` });

  if (disponibilidadInmediata < 20 && pasivosCorrientes > 0)
    hallazgos.push({ tipo: "negativo", texto: `Solo el ${disponibilidadInmediata.toFixed(0)}% de las obligaciones corrientes puede cubrirse con efectivo inmediato.` });

  if (margenNeto !== null && margenNeto >= 15)
    hallazgos.push({ tipo: "positivo", texto: `Margen neto sólido (${margenNeto.toFixed(1)}%).` });
  else if (margenNeto !== null && margenNeto < 5 && ventas > 0)
    hallazgos.push({ tipo: "negativo", texto: `Margen neto muy bajo (${margenNeto.toFixed(1)}%). Revisar estructura de costos.` });

  if (patrimonio > 0 && pasivosTotales < patrimonio)
    hallazgos.push({ tipo: "positivo", texto: "Los fondos propios superan los pasivos totales. Estructura financiera sólida." });

  const negativos = hallazgos.filter(h => h.tipo === "negativo").length;
  const semaforo  = negativos >= 3 ? "critico" : negativos >= 1 ? "en_riesgo" : "estable";

  const recomendaciones: string[] = [];
  if (concentracionCxC > 70) recomendaciones.push("Priorizar la recuperación de las cuentas por cobrar.");
  if (concentracionCxC > 70) recomendaciones.push("Implementar una política de cobranza más agresiva.");
  if (disponibilidadInmediata < 30 && pasivosCorrientes > 0)
    recomendaciones.push("Elaborar un flujo de caja proyectado para los próximos 3 meses.");
  if (pasivosTotales > 0) recomendaciones.push("Revisar el calendario de vencimiento de obligaciones.");
  recomendaciones.push("Mantener reservas de efectivo para fortalecer la posición financiera.");

  return {
    calculado: {
      activos_corrientes:         activosCorrientes,
      activos_totales:            activosTotales,
      pasivos_corrientes:         pasivosCorrientes,
      pasivos_totales:            pasivosTotales,
    },
    indicadores: {
      liquidez_corriente:       { valor: liquidezCorriente,       estado: clasifLiquidez(liquidezCorriente),   gauge_pct: gaugePct.liquidez_corriente },
      capital_trabajo:          { valor: capitalTrabajo,          estado: clasifCapital(capitalTrabajo),        gauge_pct: gaugePct.capital_trabajo },
      endeudamiento:            { valor: endeudamiento,           estado: clasifEndeud(endeudamiento),          gauge_pct: gaugePct.endeudamiento },
      deuda_patrimonio:         { valor: deudaPatrimonio,         estado: clasifDP(deudaPatrimonio),            gauge_pct: gaugePct.deuda_patrimonio },
      roe:                      { valor: roe,                     estado: clasifRoe(roe),                       gauge_pct: gaugePct.roe },
      roa:                      { valor: roa,                     estado: clasifRoa(roa),                       gauge_pct: gaugePct.roa },
      concentracion_cxc:        { valor: concentracionCxC,       estado: clasifCxC(concentracionCxC),          gauge_pct: gaugePct.concentracion_cxc },
      disponibilidad_inmediata: { valor: disponibilidadInmediata, estado: clasifDisp(disponibilidadInmediata),  gauge_pct: gaugePct.disponibilidad_inmediata },
      margen_neto:              { valor: margenNeto,              estado: clasifMargen(margenNeto),             gauge_pct: margenNeto !== null ? Math.min(1, Math.max(0, margenNeto / 40)) : 0 },
    },
    hallazgos,
    recomendaciones,
    semaforo,
  };
}

// ── CRUD EMPRESAS ─────────────────────────────────────────────

export async function listarEmpresasService() {
  const { rows } = await pool.query(`
    SELECT e.*,
      COUNT(p.id)::int         AS total_periodos,
      MAX(p.fecha_periodo)     AS ultimo_periodo_fecha,
      (SELECT p2.periodo FROM periodos_financieros p2
       WHERE p2.empresa_id = e.id
       ORDER BY p2.fecha_periodo DESC LIMIT 1) AS ultimo_periodo_label,
      (SELECT p2.id FROM periodos_financieros p2
       WHERE p2.empresa_id = e.id
       ORDER BY p2.fecha_periodo DESC LIMIT 1) AS ultimo_periodo_id,
      -- Mini-métricas del último período
      (SELECT ROUND((p2.caja_bancos + p2.cuentas_por_cobrar + p2.otros_activos_corrientes)
                    / NULLIF(p2.pasivos_corrientes, 0), 2)
       FROM periodos_financieros p2 WHERE p2.empresa_id = e.id
       ORDER BY p2.fecha_periodo DESC LIMIT 1) AS liquidez_actual,
      (SELECT ROUND(p2.utilidad_ejercicio / NULLIF(p2.patrimonio, 0) * 100, 1)
       FROM periodos_financieros p2 WHERE p2.empresa_id = e.id
       ORDER BY p2.fecha_periodo DESC LIMIT 1) AS roe_actual,
      (SELECT ROUND((p2.pasivos_corrientes + p2.pasivos_no_corrientes)
                    / NULLIF(p2.caja_bancos + p2.cuentas_por_cobrar + p2.otros_activos_corrientes
                             + p2.activo_fijo + p2.otros_activos_no_corrientes, 0) * 100, 1)
       FROM periodos_financieros p2 WHERE p2.empresa_id = e.id
       ORDER BY p2.fecha_periodo DESC LIMIT 1) AS endeudamiento_actual
    FROM empresas_analisis e
    LEFT JOIN periodos_financieros p ON p.empresa_id = e.id
    GROUP BY e.id
    ORDER BY e.nombre ASC
  `);
  return rows;
}

export async function crearEmpresaService(input: {
  nombre: string; sector?: string; moneda?: string; notas?: string;
}, usuarioId: string) {
  const { rows } = await pool.query(
    `INSERT INTO empresas_analisis (nombre, sector, moneda, notas, creado_por)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.nombre, input.sector ?? null, input.moneda ?? "PEN", input.notas ?? null, usuarioId]
  );
  return rows[0];
}

export async function actualizarEmpresaService(id: string, input: {
  nombre?: string; sector?: string; moneda?: string; notas?: string;
}) {
  const campos = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (!campos.length) throw new Error("Nada que actualizar");
  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE empresas_analisis SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...campos.map(c => (input as any)[c])]
  );
  if (!rows.length) throw new Error("Empresa no encontrada");
  return rows[0];
}

export async function eliminarEmpresaService(id: string) {
  const { rowCount } = await pool.query(`DELETE FROM empresas_analisis WHERE id = $1`, [id]);
  if (!rowCount) throw new Error("Empresa no encontrada");
  return { eliminado: true };
}

// ── CRUD PERÍODOS ─────────────────────────────────────────────

export async function listarPeriodosService(empresaId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM periodos_financieros WHERE empresa_id = $1 ORDER BY fecha_periodo DESC`,
    [empresaId]
  );
  return rows;
}

export async function crearPeriodoService(empresaId: string, input: Partial<PeriodoRow>) {
  const { rows } = await pool.query(
    `INSERT INTO periodos_financieros
       (empresa_id, periodo, fecha_periodo,
        caja_bancos, cuentas_por_cobrar, otros_activos_corrientes,
        activo_fijo, otros_activos_no_corrientes,
        pasivos_corrientes, pasivos_no_corrientes,
        patrimonio, utilidad_ejercicio, ventas_netas, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      empresaId,
      input.periodo, input.fecha_periodo,
      input.caja_bancos ?? 0, input.cuentas_por_cobrar ?? 0, input.otros_activos_corrientes ?? 0,
      input.activo_fijo ?? 0, input.otros_activos_no_corrientes ?? 0,
      input.pasivos_corrientes ?? 0, input.pasivos_no_corrientes ?? 0,
      input.patrimonio ?? 0, input.utilidad_ejercicio ?? 0, input.ventas_netas ?? 0,
      input.notas ?? null,
    ]
  );
  return rows[0];
}

export async function actualizarPeriodoService(id: string, input: Partial<PeriodoRow>) {
  const campos = Object.keys(input).filter(k =>
    k !== "id" && k !== "empresa_id" && k !== "creado_en" && (input as any)[k] !== undefined
  );
  if (!campos.length) throw new Error("Nada que actualizar");
  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE periodos_financieros SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...campos.map(c => (input as any)[c])]
  );
  if (!rows.length) throw new Error("Período no encontrado");
  return rows[0];
}

export async function eliminarPeriodoService(id: string) {
  const { rowCount } = await pool.query(`DELETE FROM periodos_financieros WHERE id = $1`, [id]);
  if (!rowCount) throw new Error("Período no encontrado");
  return { eliminado: true };
}

// ── ANÁLISIS ───────────────────────────────────────────────────

export async function analisisEmpresaService(empresaId: string, periodoId: string) {
  const [{ rows: empresaRows }, { rows: periodos }] = await Promise.all([
    pool.query(`SELECT * FROM empresas_analisis WHERE id = $1`, [empresaId]),
    pool.query(`SELECT * FROM periodos_financieros WHERE empresa_id = $1 ORDER BY fecha_periodo ASC`, [empresaId]),
  ]);

  if (!empresaRows.length) throw new Error("Empresa no encontrada");
  const empresa = empresaRows[0];

  const periodo = periodos.find((p: any) => p.id === periodoId);
  if (!periodo) throw new Error("Período no encontrado");

  const analisis = calcularIndicadores(periodo);

  // Composición de activos para el período seleccionado
  const activosCorrientes = analisis.calculado.activos_corrientes;
  const activosTotales    = analisis.calculado.activos_totales;
  const total = activosTotales || 1;

  const composicion_activos = [
    { nombre: "Caja y Bancos",           valor: Number(periodo.caja_bancos),                porcentaje: (Number(periodo.caja_bancos) / total) * 100,                color: "#22c55e" },
    { nombre: "Cuentas por Cobrar",      valor: Number(periodo.cuentas_por_cobrar),         porcentaje: (Number(periodo.cuentas_por_cobrar) / total) * 100,         color: "#27272a" },
    { nombre: "Otros Activos Corrientes",valor: Number(periodo.otros_activos_corrientes),   porcentaje: (Number(periodo.otros_activos_corrientes) / total) * 100,   color: "#52525b" },
    { nombre: "Activo Fijo",             valor: Number(periodo.activo_fijo),                porcentaje: (Number(periodo.activo_fijo) / total) * 100,                color: "#ceab11" },
    { nombre: "Otros No Corrientes",     valor: Number(periodo.otros_activos_no_corrientes),porcentaje: (Number(periodo.otros_activos_no_corrientes) / total) * 100,color: "#b8cbe8" },
  ].filter(c => c.valor > 0);

  const composicion_pasivos = [
    { nombre: "Pasivos Corrientes",      valor: Number(periodo.pasivos_corrientes),  porcentaje: analisis.calculado.pasivos_totales > 0 ? (Number(periodo.pasivos_corrientes) / analisis.calculado.pasivos_totales) * 100 : 0,  color: "#f87171" },
    { nombre: "Pasivos No Corrientes",   valor: Number(periodo.pasivos_no_corrientes),porcentaje: analisis.calculado.pasivos_totales > 0 ? (Number(periodo.pasivos_no_corrientes) / analisis.calculado.pasivos_totales) * 100 : 0,color: "#fca5a5" },
  ].filter(c => c.valor > 0);

  // Evolución de indicadores clave (todos los períodos de la empresa)
  const evolucion = periodos.map((p: PeriodoRow) => {
    const ind = calcularIndicadores(p).indicadores;
    return {
      periodo:             p.periodo,
      fecha_periodo:       p.fecha_periodo,
      liquidez_corriente:  ind.liquidez_corriente.valor,
      endeudamiento:       ind.endeudamiento.valor,
      roe:                 ind.roe.valor,
      roa:                 ind.roa.valor,
      disponibilidad:      ind.disponibilidad_inmediata.valor,
    };
  });

  return {
    empresa,
    periodo,
    ...analisis,
    composicion_activos,
    composicion_pasivos,
    evolucion,
    total_periodos: periodos.length,
  };
}
