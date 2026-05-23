/** src/server/services/inteligencia.service.ts */

import { pool } from "../config/database";
import { cacheGet, cacheSet } from "../config/cache";

// ─── Actividad comercial KPIs ─────────────────────────────────────────────────

export async function actividadKPIsService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const desde = filters?.fecha_inicio ?? null;
  const hasta = filters?.fecha_fin ?? null;

  const cacheKey = `actividad:${desde ?? ""}:${hasta ?? ""}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const [llamadas, reuniones, propuestas, brochures] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*)::int                                                   AS total,
        COUNT(*) FILTER (WHERE contestada = true)::int                 AS contestadas,
        COUNT(*) FILTER (WHERE contestada = false)::int                AS no_contestadas,
        ROUND(AVG(duracion_minutos) FILTER (WHERE duracion_minutos > 0))::int AS duracion_prom,
        SUM(duracion_minutos) FILTER (WHERE duracion_minutos > 0)::int AS duracion_total
       FROM llamadas
       WHERE ($1::date IS NULL OR fecha >= $1::date)
         AND ($2::date IS NULL OR fecha  < $2::date)`,
      [desde, hasta]
    ),
    pool.query(
      `SELECT
        COUNT(*)::int                                             AS total,
        COUNT(*) FILTER (WHERE estado = 'realizada')::int        AS realizadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada')::int        AS canceladas,
        COUNT(*) FILTER (WHERE estado = 'postergada')::int       AS postergadas,
        COUNT(*) FILTER (WHERE estado = 'programada')::int       AS programadas
       FROM reuniones
       WHERE ($1::date IS NULL OR fecha_hora >= $1::date)
         AND ($2::date IS NULL OR fecha_hora  < $2::date)`,
      [desde, hasta]
    ),
    pool.query(
      `SELECT
        COUNT(*)::int                                             AS total,
        COUNT(*) FILTER (WHERE estado = 'enviada')::int          AS enviadas,
        COUNT(*) FILTER (WHERE estado = 'aceptada')::int         AS aceptadas,
        COUNT(*) FILTER (WHERE estado = 'rechazada')::int        AS rechazadas,
        COUNT(*) FILTER (WHERE estado IN ('caida','caída'))::int  AS caidas,
        COALESCE(SUM(
          CASE WHEN moneda = 'USD' THEN monto_cerrado * tipo_cambio ELSE monto_cerrado END
        ) FILTER (WHERE estado='aceptada'),0)::float AS monto_cerrado
       FROM propuestas
       WHERE ($1::date IS NULL OR fecha_propuesta >= $1::date)
         AND ($2::date IS NULL OR fecha_propuesta  < $2::date)`,
      [desde, hasta]
    ),
    pool.query(
      `SELECT
        COUNT(*)::int                                  AS total,
        COUNT(*) FILTER (WHERE enviado = true)::int   AS enviados,
        canal,
        COUNT(*)::int                                  AS por_canal
       FROM brochures
       WHERE ($1::date IS NULL OR fecha_envio >= $1::date)
         AND ($2::date IS NULL OR fecha_envio  < $2::date)
       GROUP BY canal`,
      [desde, hasta]
    ),
  ]);

  const l = llamadas.rows[0] ?? {};
  const r = reuniones.rows[0] ?? {};
  const p = propuestas.rows[0] ?? {};
  const bTotal = brochures.rows.reduce((s: number, row: any) => s + (row.total ?? 0), 0);
  const bEnv   = brochures.rows.reduce((s: number, row: any) => s + (row.enviados ?? 0), 0);

  const tasaContacto = l.total > 0
    ? Math.round((l.contestadas / l.total) * 100)
    : 0;

  const result = {
    llamadas: {
      total:         l.total         ?? 0,
      contestadas:   l.contestadas   ?? 0,
      no_contestadas:l.no_contestadas?? 0,
      duracion_prom: l.duracion_prom ?? 0,
      duracion_total:l.duracion_total?? 0,
      tasa_contacto: tasaContacto,
    },
    reuniones: {
      total:      r.total      ?? 0,
      realizadas: r.realizadas ?? 0,
      canceladas: r.canceladas ?? 0,
      postergadas:r.postergadas?? 0,
      programadas:r.programadas?? 0,
    },
    propuestas: {
      total:        p.total        ?? 0,
      enviadas:     p.enviadas     ?? 0,
      aceptadas:    p.aceptadas    ?? 0,
      rechazadas:   p.rechazadas   ?? 0,
      caidas:       p.caidas       ?? 0,
      monto_cerrado:p.monto_cerrado?? 0,
    },
    brochures: {
      total:   bTotal,
      enviados:bEnv,
    },
  };
  await cacheSet(cacheKey, result, 900); // 15 min
  return result;
}

// ─── Insights automáticos ─────────────────────────────────────────────────────

type TipoInsight = "positivo" | "alerta" | "info" | "oportunidad";
interface Insight {
  tipo:    TipoInsight;
  titulo:  string;
  texto:   string;
  icono:   string;
  valor?:  number;
  total?:  number;
  unidad?: "pct" | "count";
}

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function horaLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export async function insightsAutomaticosService(): Promise<Insight[]> {
  const cached = await cacheGet<Insight[]>("inteligencia:insights");
  if (cached) return cached;

  const insights: Insight[] = [];

  // ── 1. Mejor franja horaria (últimos 30 días) ──────────────────────────────
  const mejorHora = await pool.query(`
    SELECT EXTRACT(HOUR FROM fecha)::int AS hora,
           COUNT(*)::int                 AS total,
           ROUND(COUNT(*) FILTER (WHERE contestada=true)*100.0 / NULLIF(COUNT(*),0))::int AS tasa
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY hora HAVING COUNT(*) >= 3
    ORDER BY tasa DESC, total DESC
    LIMIT 1
  `);
  if (mejorHora.rows[0]?.tasa >= 40) {
    const { hora, tasa, total } = mejorHora.rows[0];
    insights.push({
      tipo: "positivo", icono: "🕐",
      titulo: "Mejor franja de contacto",
      texto: `Alrededor de las ${horaLabel(hora)} logras ${tasa}% de respuesta (${total} llamadas). A esa hora los prospectos están menos ocupados — concentra tus llamadas ahí.`,
      valor: tasa, total: 100, unidad: "pct",
    });
  }

  // ── 2. Mejor día de la semana ─────────────────────────────────────────────
  const mejorDia = await pool.query(`
    SELECT EXTRACT(DOW FROM fecha)::int AS dow,
           COUNT(*)::int                AS total,
           ROUND(COUNT(*) FILTER (WHERE contestada=true)*100.0 / NULLIF(COUNT(*),0))::int AS tasa
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY dow HAVING COUNT(*) >= 3
    ORDER BY tasa DESC, total DESC
    LIMIT 1
  `);
  if (mejorDia.rows[0]?.tasa >= 40) {
    const { dow, tasa, total } = mejorDia.rows[0];
    insights.push({
      tipo: "positivo", icono: "📅",
      titulo: "Mejor día para llamar",
      texto: `Los ${DIAS[dow]} tienes ${tasa}% de contactabilidad sobre ${total} llamadas. Los prospectos son más receptivos ese día — agenda tus llamadas más importantes para entonces.`,
      valor: tasa, total: 100, unidad: "pct",
    });
  }

  // ── 3. Canal más efectivo ─────────────────────────────────────────────────
  const mejorCanal = await pool.query(`
    SELECT canal,
           COUNT(*)::int                                            AS total,
           COUNT(*) FILTER (WHERE resultado='interesado')::int     AS interesados
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '60 days'
    GROUP BY canal HAVING COUNT(*) >= 5
    ORDER BY (COUNT(*) FILTER (WHERE resultado='interesado'))::float / NULLIF(COUNT(*),0) DESC
    LIMIT 1
  `);
  if (mejorCanal.rows[0]?.interesados > 0) {
    const { canal, interesados, total } = mejorCanal.rows[0];
    const pct = Math.round((interesados / total) * 100);
    insights.push({
      tipo: "info", icono: "📲",
      titulo: "Canal más efectivo",
      texto: `${canal.charAt(0).toUpperCase() + canal.slice(1)} convierte ${pct}% de contactos en interesados (${interesados} de ${total}). Probablemente porque permite mayor personalización — prioriza este canal para prospectos de alta prioridad.`,
      valor: pct, total: 100, unidad: "pct",
    });
  }

  // ── 4. Leads sin actividad +14 días ──────────────────────────────────────
  const sinActividad = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM prospectos p
    WHERE etapa_pipeline NOT IN ('cerrado_ganado','perdido')
      AND NOT EXISTS (
        SELECT 1 FROM llamadas l
        WHERE l.prospecto_id = p.id AND l.fecha >= CURRENT_DATE - INTERVAL '14 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM reuniones r
        WHERE r.prospecto_id = p.id AND r.fecha_hora >= CURRENT_DATE - INTERVAL '14 days'
      )
  `);
  const nSinAct = sinActividad.rows[0]?.n ?? 0;
  if (nSinAct > 0) {
    insights.push({
      tipo: "alerta", icono: "⚠️",
      titulo: "Leads olvidados",
      texto: `${nSinAct} lead${nSinAct > 1 ? "s activos llevan" : " activo lleva"} más de 14 días sin contacto. Sin seguimiento, los prospectos enfrian su interés y buscan otras opciones — contáctalos esta semana.`,
      valor: nSinAct, unidad: "count",
    });
  }

  // ── 5. Leads estancados en negociación +14 días ───────────────────────────
  const negEst = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM prospectos
    WHERE etapa_pipeline = 'negociacion'
      AND actualizado_en < CURRENT_TIMESTAMP - INTERVAL '14 days'
  `);
  const nNeg = negEst.rows[0]?.n ?? 0;
  if (nNeg > 0) {
    insights.push({
      tipo: "alerta", icono: "🔴",
      titulo: "Negociaciones estancadas",
      texto: `${nNeg} lead${nNeg > 1 ? "s llevan" : " lleva"} más de 14 días en Negociación sin moverse. Las negociaciones que no avanzan suelen caerse — clarifica objeciones o propone un cierre parcial esta semana.`,
      valor: nNeg, unidad: "count",
    });
  }

  // ── 6. Propuestas sin respuesta +7 días ──────────────────────────────────
  const propSinResp = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM propuestas
    WHERE estado = 'enviada'
      AND fecha_propuesta <= CURRENT_DATE - INTERVAL '7 days'
  `);
  const nProp = propSinResp.rows[0]?.n ?? 0;
  if (nProp > 0) {
    insights.push({
      tipo: "alerta", icono: "📋",
      titulo: "Propuestas sin respuesta",
      texto: `${nProp} propuesta${nProp > 1 ? "s llevan" : " lleva"} más de 7 días sin respuesta. El silencio suele significar dudas, no rechazo — un mensaje de seguimiento corto puede desbloquear la decisión.`,
      valor: nProp, unidad: "count",
    });
  }

  // ── 7. Leads interesados sin propuesta ────────────────────────────────────
  const sinPropuesta = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM prospectos p
    WHERE etapa_pipeline IN ('interesado','negociacion')
      AND NOT EXISTS (SELECT 1 FROM propuestas WHERE prospecto_id = p.id)
  `);
  const nSinProp = sinPropuesta.rows[0]?.n ?? 0;
  if (nSinProp > 0) {
    insights.push({
      tipo: "oportunidad", icono: "💡",
      titulo: "Oportunidad de propuesta",
      texto: `${nSinProp} lead${nSinProp > 1 ? "s están" : " está"} en interés o negociación sin propuesta enviada. Ya mostraron intención de compra — no hacerles llegar una propuesta es dejar dinero sobre la mesa.`,
      valor: nSinProp, unidad: "count",
    });
  }

  // ── 8. Tasa de contactabilidad general ───────────────────────────────────
  const contactabilidad = await pool.query(`
    SELECT
      COUNT(*)::int                                               AS total,
      COUNT(*) FILTER (WHERE contestada=true)::int               AS contestadas,
      ROUND(COUNT(*) FILTER (WHERE contestada=true)*100.0 / NULLIF(COUNT(*),0))::int AS tasa
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
  `);
  const ct = contactabilidad.rows[0];
  if (ct?.total >= 10) {
    const tasa = ct.tasa ?? 0;
    if (tasa >= 50) {
      insights.push({
        tipo: "positivo", icono: "📞",
        titulo: "Buena contactabilidad",
        texto: `${tasa}% de tus llamadas del último mes fueron contestadas (${ct.contestadas} de ${ct.total}). Indica que estás llamando en buenos horarios y a prospectos con interés real — mantén ese ritmo.`,
        valor: tasa, total: 100, unidad: "pct",
      });
    } else if (tasa < 30) {
      insights.push({
        tipo: "alerta", icono: "📞",
        titulo: "Baja contactabilidad",
        texto: `Solo ${tasa}% de tus llamadas del último mes fueron contestadas (${ct.contestadas} de ${ct.total}). Puede deberse a horarios inadecuados o lista sin calificar — prueba llamar entre 10am–12pm o enviar un WhatsApp previo.`,
        valor: tasa, total: 100, unidad: "pct",
      });
    }
  }

  await cacheSet("inteligencia:insights", insights, 7200); // 2 horas
  return insights;
}

// ─── Prioridad operacional ────────────────────────────────────────────────────

export interface AccionPrioridad {
  nivel:       "critica" | "urgente" | "pendiente";
  icono:       string;
  titulo:      string;
  descripcion: string;
  cantidad:    number;
  accion:      string;
  tipo:        string;
}

export async function prioridadOperacionalService(): Promise<AccionPrioridad[]> {
  const cached = await cacheGet<AccionPrioridad[]>("inteligencia:prioridad");
  if (cached) return cached;

  const [a, b, c, d, e] = await Promise.all([
    // 1. Interesados sin propuesta
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos p
      WHERE etapa_pipeline IN ('interesado','negociacion')
        AND NOT EXISTS (SELECT 1 FROM propuestas WHERE prospecto_id = p.id)
    `),
    // 2. Negociaciones sin actividad +7 días
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos
      WHERE etapa_pipeline = 'negociacion'
        AND actualizado_en < CURRENT_TIMESTAMP - INTERVAL '7 days'
    `),
    // 3. Propuestas sin respuesta +7 días
    pool.query(`
      SELECT COUNT(*)::int AS n FROM propuestas
      WHERE estado = 'enviada'
        AND fecha_propuesta <= CURRENT_DATE - INTERVAL '7 days'
    `),
    // 4. Leads marcados como "volver a llamar"
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos
      WHERE estado_lead = 'volver_a_llamar'
        AND etapa_pipeline NOT IN ('cerrado_ganado','perdido')
    `),
    // 5. Leads por gestionar — misma definición que ProspectosPage
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos
      WHERE estado_lead::text = 'por_gestionar'
        AND etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
    `),
  ]);

  const acciones: AccionPrioridad[] = [];

  if (a.rows[0].n > 0) acciones.push({
    nivel: "critica", icono: "🔥", tipo: "sin_propuesta",
    titulo: "Enviar propuestas",
    descripcion: `${a.rows[0].n} leads en etapa Interesado/Negociación sin propuesta enviada. Son los más cercanos al cierre.`,
    cantidad: a.rows[0].n, accion: "Ver leads",
  });

  if (b.rows[0].n > 0) acciones.push({
    nivel: "critica", icono: "🚨", tipo: "negociacion_inactiva",
    titulo: "Reactivar negociaciones",
    descripcion: `${b.rows[0].n} lead${b.rows[0].n > 1 ? "s" : ""} en Negociación sin actividad hace más de 7 días. Alta probabilidad de perderlos.`,
    cantidad: b.rows[0].n, accion: "Ver leads",
  });

  if (c.rows[0].n > 0) acciones.push({
    nivel: "urgente", icono: "📋", tipo: "propuesta_sin_respuesta",
    titulo: "Seguimiento de propuestas",
    descripcion: `${c.rows[0].n} propuesta${c.rows[0].n > 1 ? "s" : ""} enviada${c.rows[0].n > 1 ? "s" : ""} sin respuesta en más de 7 días. Un seguimiento aumenta la probabilidad de cierre.`,
    cantidad: c.rows[0].n, accion: "Ver leads",
  });

  if (d.rows[0].n > 0) acciones.push({
    nivel: "urgente", icono: "📞", tipo: "volver_llamar",
    titulo: "Volver a llamar",
    descripcion: `${d.rows[0].n} lead${d.rows[0].n > 1 ? "s solicitaron" : " solicitó"} ser contactado${d.rows[0].n > 1 ? "s" : ""} de nuevo. Están esperando tu llamada.`,
    cantidad: d.rows[0].n, accion: "Ver leads",
  });

  if (e.rows[0].n > 0) acciones.push({
    nivel: "pendiente", icono: "📬", tipo: "sin_contacto",
    titulo: "Leads sin primer contacto",
    descripcion: `${e.rows[0].n} leads nuevos que nunca han recibido una llamada ni reunión. Son oportunidades sin explorar.`,
    cantidad: e.rows[0].n, accion: "Ver leads",
  });

  await cacheSet("inteligencia:prioridad", acciones, 1800); // 30 min
  return acciones;
}

// ─── Leads estancados (lista detallada) ──────────────────────────────────────

export async function leadsEstancadosService(dias = 14) {
  const cacheKey = `inteligencia:estancados:${dias}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const result = await pool.query(
    `SELECT p.id, p.empresa, p.nombre_contacto, p.telefono,
            p.etapa_pipeline, p.prioridad, p.creado_en,
            MAX(l.fecha)       AS ultima_llamada,
            MAX(r.fecha_hora)  AS ultima_reunion,
            GREATEST(MAX(l.fecha), MAX(r.fecha_hora)) AS ultima_actividad
     FROM prospectos p
     LEFT JOIN llamadas l  ON l.prospecto_id = p.id
     LEFT JOIN reuniones r ON r.prospecto_id = p.id
     WHERE p.etapa_pipeline NOT IN ('cerrado_ganado','perdido')
     GROUP BY p.id
     HAVING GREATEST(MAX(l.fecha), MAX(r.fecha_hora)) < CURRENT_TIMESTAMP - ($1 || ' days')::interval
         OR (MAX(l.fecha) IS NULL AND MAX(r.fecha_hora) IS NULL)
     ORDER BY ultima_actividad ASC NULLS FIRST
     LIMIT 20`,
    [dias]
  );
  await cacheSet(cacheKey, result.rows, 1800); // 30 min
  return result.rows;
}

// ─── Tendencias vs período anterior ─────────────────────────────────────────

export interface TendenciaKPI {
  actual:   number;
  anterior: number;
  pct:      number | null;
}

export interface Tendencias {
  llamadas:  TendenciaKPI;
  reuniones: TendenciaKPI;
  brochures: TendenciaKPI;
}

function rangoPeriodo(periodo: string, mes?: number, anio?: number) {
  const hoy = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (periodo === "mes" && mes && anio) {
    const ini  = `${anio}-${String(mes).padStart(2,"0")}-01`;
    const fin  = fmt(new Date(anio, mes, 1));
    const pm   = mes === 1 ? 12 : mes - 1;
    const pa   = mes === 1 ? anio - 1 : anio;
    const iniP = `${pa}-${String(pm).padStart(2,"0")}-01`;
    return { curr: { ini, fin }, prev: { ini: iniP, fin: ini } };
  }
  const dias = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;
  const d1 = new Date(hoy); d1.setDate(hoy.getDate() - dias);
  const d2 = new Date(hoy); d2.setDate(hoy.getDate() - dias * 2);
  return { curr: { ini: fmt(d1), fin: fmt(hoy) }, prev: { ini: fmt(d2), fin: fmt(d1) } };
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function tendenciasService(periodo: string, mes?: number, anio?: number): Promise<Tendencias> {
  if (periodo === "todo") return {
    llamadas:  { actual: 0, anterior: 0, pct: null },
    reuniones: { actual: 0, anterior: 0, pct: null },
    brochures: { actual: 0, anterior: 0, pct: null },
  };

  const cacheKey = `inteligencia:tendencias:${periodo}:${mes ?? ""}:${anio ?? ""}`;
  const cached = await cacheGet<Tendencias>(cacheKey);
  if (cached) return cached;

  const { curr, prev } = rangoPeriodo(periodo, mes, anio);

  const [lC, lP, rC, rP, bC, bP] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS n FROM llamadas  WHERE fecha        >= $1::date AND fecha        < $2::date`, [curr.ini, curr.fin]),
    pool.query(`SELECT COUNT(*)::int AS n FROM llamadas  WHERE fecha        >= $1::date AND fecha        < $2::date`, [prev.ini, prev.fin]),
    pool.query(`SELECT COUNT(*)::int AS n FROM reuniones WHERE fecha_hora   >= $1::date AND fecha_hora   < $2::date`, [curr.ini, curr.fin]),
    pool.query(`SELECT COUNT(*)::int AS n FROM reuniones WHERE fecha_hora   >= $1::date AND fecha_hora   < $2::date`, [prev.ini, prev.fin]),
    pool.query(`SELECT COUNT(*)::int AS n FROM brochures WHERE fecha_envio  >= $1::date AND fecha_envio  < $2::date`, [curr.ini, curr.fin]),
    pool.query(`SELECT COUNT(*)::int AS n FROM brochures WHERE fecha_envio  >= $1::date AND fecha_envio  < $2::date`, [prev.ini, prev.fin]),
  ]);

  const la = lC.rows[0]?.n ?? 0, lant = lP.rows[0]?.n ?? 0;
  const ra = rC.rows[0]?.n ?? 0, rant = rP.rows[0]?.n ?? 0;
  const ba = bC.rows[0]?.n ?? 0, bant = bP.rows[0]?.n ?? 0;

  const result: Tendencias = {
    llamadas:  { actual: la, anterior: lant, pct: pct(la, lant) },
    reuniones: { actual: ra, anterior: rant, pct: pct(ra, rant) },
    brochures: { actual: ba, anterior: bant, pct: pct(ba, bant) },
  };
  await cacheSet(cacheKey, result, 3600); // 1 hora
  return result;
}

// ─── Objetivos diarios ───────────────────────────────────────────────────────

export interface ObjetivosDiarios {
  llamadas_meta:  number;
  reuniones_meta: number;
  brochures_meta: number;
  llamadas_hoy:   number;
  reuniones_hoy:  number;
  brochures_hoy:  number;
}

export async function getObjetivosService(usuarioId: string): Promise<ObjetivosDiarios> {
  const [metas, actuals] = await Promise.all([
    pool.query(
      `SELECT llamadas_meta, reuniones_meta, brochures_meta
       FROM objetivos_diarios WHERE usuario_id = $1`,
      [usuarioId]
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM llamadas
          WHERE creado_por = $1 AND fecha::date = CURRENT_DATE)       AS llamadas_hoy,
         (SELECT COUNT(*)::int FROM reuniones
          WHERE creado_por = $1 AND fecha_hora::date = CURRENT_DATE)  AS reuniones_hoy,
         (SELECT COUNT(*)::int FROM brochures
          WHERE creado_por = $1 AND fecha_envio = CURRENT_DATE)       AS brochures_hoy`,
      [usuarioId]
    ),
  ]);

  const m = metas.rows[0];
  const a = actuals.rows[0];

  return {
    llamadas_meta:  m?.llamadas_meta  ?? 10,
    reuniones_meta: m?.reuniones_meta ?? 2,
    brochures_meta: m?.brochures_meta ?? 5,
    llamadas_hoy:   a?.llamadas_hoy   ?? 0,
    reuniones_hoy:  a?.reuniones_hoy  ?? 0,
    brochures_hoy:  a?.brochures_hoy  ?? 0,
  };
}

export async function actualizarObjetivosService(
  usuarioId: string,
  metas: { llamadas_meta: number; reuniones_meta: number; brochures_meta: number }
): Promise<void> {
  await pool.query(
    `INSERT INTO objetivos_diarios (usuario_id, llamadas_meta, reuniones_meta, brochures_meta, actualizado_en)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (usuario_id)
     DO UPDATE SET llamadas_meta = $2, reuniones_meta = $3, brochures_meta = $4, actualizado_en = NOW()`,
    [usuarioId, metas.llamadas_meta, metas.reuniones_meta, metas.brochures_meta]
  );
}

// ─── Pronóstico comercial ─────────────────────────────────────────────────────

export interface Forecast {
  llamadas_semana_prom:   number;
  tendencia:              "subiendo" | "estable" | "bajando";
  tasa_conversion_pct:    number;
  leads_activos:          number;
  leads_calientes:        number;
  cierres_mes_actual:     number;
  cierres_proyectados:    number;
  ciclo_promedio_dias:    number;
  contactos_necesarios:   number;
}

export async function forecastingService(): Promise<Forecast> {
  const cached = await cacheGet<Forecast>("inteligencia:forecast");
  if (cached) return cached;

  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    // Llamadas últimas 4 semanas (promedio semanal)
    pool.query(`
      SELECT ROUND(COUNT(*)::float / 4, 1) AS prom
      FROM llamadas WHERE fecha >= CURRENT_DATE - INTERVAL '28 days'
    `),
    // Llamadas semanas 5-8 (para tendencia)
    pool.query(`
      SELECT ROUND(COUNT(*)::float / 4, 1) AS prom
      FROM llamadas
      WHERE fecha >= CURRENT_DATE - INTERVAL '56 days'
        AND fecha  <  CURRENT_DATE - INTERVAL '28 days'
    `),
    // Tasa conversión: leads creados últimos 90 días → cerrado_ganado
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE etapa_pipeline = 'cerrado_ganado')::int AS cerrados
      FROM prospectos
      WHERE creado_en >= CURRENT_DATE - INTERVAL '90 days'
    `),
    // Leads calientes: propuesta_enviada + negociacion
    pool.query(`
      SELECT COUNT(*)::int AS n
      FROM prospectos
      WHERE etapa_pipeline IN ('propuesta_enviada','negociacion')
    `),
    // Ciclo promedio de venta (días creación → cerrado)
    pool.query(`
      SELECT COALESCE(ROUND(AVG(
        EXTRACT(EPOCH FROM (actualizado_en - creado_en)) / 86400
      ))::int, 30) AS dias
      FROM prospectos WHERE etapa_pipeline = 'cerrado_ganado'
    `),
    // Cierres del mes en curso
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos
      WHERE etapa_pipeline = 'cerrado_ganado'
        AND actualizado_en >= DATE_TRUNC('month', CURRENT_DATE)
    `),
  ]);

  const llamadasProm    = parseFloat(r1.rows[0]?.prom ?? 0);
  const llamadasPrev    = parseFloat(r2.rows[0]?.prom ?? 0);
  const totalLeads      = r3.rows[0]?.total  ?? 0;
  const cerradosHist    = r3.rows[0]?.cerrados ?? 0;
  const leadsCalientes  = r4.rows[0]?.n ?? 0;
  const cicloDias       = r5.rows[0]?.dias ?? 30;
  const cierresActuales = r6.rows[0]?.n ?? 0;

  // Tasa de conversión histórica
  const tasaPct = totalLeads > 0 ? Math.round((cerradosHist / totalLeads) * 100) : 0;

  // Tendencia de actividad
  const tendencia: Forecast["tendencia"] =
    llamadasProm > llamadasPrev * 1.1 ? "subiendo" :
    llamadasProm < llamadasPrev * 0.9 ? "bajando"  : "estable";

  // Proyección: días restantes del mes
  const hoy       = new Date();
  const diasMes   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRest  = diasMes - hoy.getDate();
  const semanasR  = diasRest / 7;
  const contactosR = Math.round(llamadasProm * semanasR);
  const proyAdd    = tasaPct > 0 ? contactosR * (tasaPct / 100) : 0;
  const cierresProyectados = Math.round(cierresActuales + proyAdd);

  // Contactos necesarios para cerrar 5 (meta base)
  const metaCierres = Math.max(5, cierresActuales + 2);
  const cierresFaltantes = Math.max(0, metaCierres - cierresActuales);
  const contactosNecesarios = tasaPct > 0
    ? Math.ceil(cierresFaltantes / (tasaPct / 100))
    : 0;

  // Leads activos (no cerrado ni perdido)
  const leadsActivosRes = await pool.query(`
    SELECT COUNT(*)::int AS n FROM prospectos
    WHERE etapa_pipeline NOT IN ('cerrado_ganado','perdido')
  `);
  const leadsActivos = leadsActivosRes.rows[0]?.n ?? 0;

  const result: Forecast = {
    llamadas_semana_prom:  llamadasProm,
    tendencia,
    tasa_conversion_pct:   tasaPct,
    leads_activos:         leadsActivos,
    leads_calientes:       leadsCalientes,
    cierres_mes_actual:    cierresActuales,
    cierres_proyectados:   cierresProyectados,
    ciclo_promedio_dias:   cicloDias,
    contactos_necesarios:  contactosNecesarios,
  };
  await cacheSet("inteligencia:forecast", result, 3600); // 1 hora
  return result;
}

// ─── Leads detalle por tipo de acción prioritaria ─────────────────────────────

export async function leadesPrioridadService(tipo: string) {
  const SELECT_BASE = `
    SELECT p.id, p.empresa, p.nombre_contacto, p.telefono,
           p.etapa_pipeline, p.estado_lead, p.ciudad,
           p.actualizado_en
  `;

  let query = "";

  if (tipo === "sin_propuesta") {
    query = `${SELECT_BASE}
      FROM prospectos p
      WHERE p.etapa_pipeline IN ('interesado','negociacion')
        AND NOT EXISTS (SELECT 1 FROM propuestas WHERE prospecto_id = p.id)
      ORDER BY p.etapa_pipeline DESC, p.actualizado_en ASC
      LIMIT 100`;

  } else if (tipo === "negociacion_inactiva") {
    query = `${SELECT_BASE}
      FROM prospectos p
      WHERE p.etapa_pipeline = 'negociacion'
        AND p.actualizado_en < CURRENT_TIMESTAMP - INTERVAL '7 days'
      ORDER BY p.actualizado_en ASC
      LIMIT 100`;

  } else if (tipo === "propuesta_sin_respuesta") {
    query = `
      SELECT p.id, p.empresa, p.nombre_contacto, p.telefono,
             p.etapa_pipeline, p.estado_lead, p.ciudad,
             pr.fecha_propuesta AS actualizado_en
      FROM propuestas pr
      JOIN prospectos p ON p.id = pr.prospecto_id
      WHERE pr.estado = 'enviada'
        AND pr.fecha_propuesta <= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY pr.fecha_propuesta ASC
      LIMIT 100`;

  } else if (tipo === "volver_llamar") {
    query = `${SELECT_BASE}
      FROM prospectos p
      WHERE p.estado_lead = 'volver_a_llamar'
        AND p.etapa_pipeline NOT IN ('cerrado_ganado','perdido')
      ORDER BY p.actualizado_en ASC
      LIMIT 100`;

  } else if (tipo === "sin_contacto") {
    query = `${SELECT_BASE}
      FROM prospectos p
      WHERE p.estado_lead::text = 'por_gestionar'
        AND p.etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
      ORDER BY p.actualizado_en DESC
      LIMIT 100`;

  } else {
    return [];
  }

  const result = await pool.query(query);
  return result.rows;
}

// ─── 1. Análisis de abandono del pipeline ─────────────────────────────────────

export async function abandonoPipelineService() {
  const [porEtapa, porMotivo, cruce, motivosPropuesta] = await Promise.all([
    // Leads perdidos por etapa (etapa_pipeline solo tiene 'perdido', no 'descartado')
    // clasificacion = 'descartado' captura los descartados
    pool.query(`
      SELECT
        CASE
          WHEN clasificacion = 'descartado' AND etapa_pipeline != 'perdido' THEN 'descartado'
          ELSE etapa_pipeline::text
        END AS etapa,
        COUNT(*)::int AS total
      FROM prospectos
      WHERE etapa_pipeline = 'perdido'
         OR clasificacion = 'descartado'
      GROUP BY 1
      ORDER BY total DESC
    `),
    pool.query(`
      SELECT motivo_no_interes AS motivo, COUNT(*)::int AS total
      FROM llamadas
      WHERE motivo_no_interes IS NOT NULL AND motivo_no_interes != ''
      GROUP BY motivo_no_interes
      ORDER BY total DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT p.etapa_pipeline::text AS etapa, l.motivo_no_interes AS motivo, COUNT(*)::int AS total
      FROM prospectos p
      JOIN llamadas l ON l.prospecto_id = p.id
      WHERE l.motivo_no_interes IS NOT NULL AND l.motivo_no_interes != ''
        AND (p.etapa_pipeline = 'perdido' OR p.clasificacion = 'descartado')
      GROUP BY p.etapa_pipeline, l.motivo_no_interes
      ORDER BY total DESC
      LIMIT 20
    `),
    // Capa 2: motivos de propuestas cerradas perdidas / vencidas
    pool.query(`
      SELECT motivo_cierre_perdido AS motivo, COUNT(*)::int AS total
      FROM propuestas
      WHERE estado IN ('cerrada_perdida','vencida')
        AND motivo_cierre_perdido IS NOT NULL
        AND motivo_cierre_perdido != ''
      GROUP BY motivo_cierre_perdido
      ORDER BY total DESC
      LIMIT 10
    `),
  ]);

  const funnelAbandono = await pool.query(`
    SELECT etapa_pipeline::text AS etapa, COUNT(*)::int AS total
    FROM prospectos
    WHERE etapa_pipeline != 'cerrado_ganado'
    GROUP BY etapa_pipeline
    ORDER BY CASE etapa_pipeline::text
      WHEN 'nuevo'             THEN 1
      WHEN 'contactado'        THEN 2
      WHEN 'interesado'        THEN 3
      WHEN 'propuesta_enviada' THEN 4
      WHEN 'negociacion'       THEN 5
      WHEN 'perdido'           THEN 6
      ELSE 7 END
  `);

  return {
    por_etapa:        porEtapa.rows,
    por_motivo:       porMotivo.rows,
    cruce:            cruce.rows,
    funnel_abandono:  funnelAbandono.rows,
    motivos_propuesta: motivosPropuesta.rows,
  };
}

// ─── 1b. Rechazos duales (primer contacto + propuestas perdidas) ─────────────

export async function rechazosDualesService() {
  const [primerContacto, propuestasPerdidas] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                                      AS total_no_interesado,
        COUNT(*) FILTER (WHERE motivo_no_interes IS NOT NULL
                           AND motivo_no_interes != '')::int              AS con_motivo,
        COUNT(*) FILTER (WHERE motivo_no_interes IS NULL
                           OR  motivo_no_interes = '')::int               AS sin_motivo,
        ROUND(COUNT(*) * 100.0 / NULLIF(
          (SELECT COUNT(*) FROM llamadas), 0))::int                       AS pct_rechazo
      FROM llamadas
      WHERE resultado = 'no_interesado'
    `),
    pool.query(`
      SELECT
        COUNT(*)::int                                                      AS total,
        COUNT(*) FILTER (WHERE motivo_cierre_perdido IS NOT NULL
                           AND motivo_cierre_perdido != '')::int          AS con_motivo,
        COUNT(*) FILTER (WHERE motivo_cierre_perdido IS NULL
                           OR  motivo_cierre_perdido = '')::int           AS sin_motivo,
        COALESCE(SUM(
          CASE WHEN moneda = 'USD'
            THEN COALESCE(monto_cerrado, monto_propuesto) * tipo_cambio
            ELSE COALESCE(monto_cerrado, monto_propuesto) END
        ), 0)::float                                                       AS monto_perdido,
        COUNT(*) FILTER (WHERE estado = 'cerrada_perdida')::int           AS cerradas_perdidas,
        COUNT(*) FILTER (WHERE estado = 'vencida')::int                   AS vencidas
      FROM propuestas
      WHERE estado IN ('cerrada_perdida', 'vencida')
    `),
  ]);

  const [motivosContacto, motivosPropuesta] = await Promise.all([
    pool.query(`
      SELECT motivo_no_interes AS motivo, COUNT(*)::int AS total
      FROM llamadas
      WHERE resultado = 'no_interesado'
        AND motivo_no_interes IS NOT NULL AND motivo_no_interes != ''
      GROUP BY motivo_no_interes
      ORDER BY total DESC LIMIT 8
    `),
    pool.query(`
      SELECT motivo_cierre_perdido AS motivo, COUNT(*)::int AS total
      FROM propuestas
      WHERE estado IN ('cerrada_perdida','vencida')
        AND motivo_cierre_perdido IS NOT NULL AND motivo_cierre_perdido != ''
      GROUP BY motivo_cierre_perdido
      ORDER BY total DESC LIMIT 8
    `),
  ]);

  const pc = primerContacto.rows[0] ?? {};
  const pp = propuestasPerdidas.rows[0] ?? {};

  return {
    primer_contacto: {
      total_no_interesado: pc.total_no_interesado ?? 0,
      con_motivo:          pc.con_motivo          ?? 0,
      sin_motivo:          pc.sin_motivo          ?? 0,
      pct_rechazo:         pc.pct_rechazo         ?? 0,
      motivos:             motivosContacto.rows,
    },
    propuestas_perdidas: {
      total:            pp.total            ?? 0,
      con_motivo:       pp.con_motivo       ?? 0,
      sin_motivo:       pp.sin_motivo       ?? 0,
      monto_perdido:    pp.monto_perdido    ?? 0,
      cerradas_perdidas:pp.cerradas_perdidas?? 0,
      vencidas:         pp.vencidas         ?? 0,
      motivos:          motivosPropuesta.rows,
    },
  };
}

// ─── 2. Tiempo de primera respuesta ──────────────────────────────────────────

export async function tiempoPrimeraRespuestaService() {
  const [general, distribucion] = await Promise.all([
    pool.query(`
      SELECT
        ROUND(AVG(fecha_primer_contacto - creado_en::date))::int   AS promedio_dias,
        ROUND(MIN(fecha_primer_contacto - creado_en::date))::int   AS minimo_dias,
        ROUND(MAX(fecha_primer_contacto - creado_en::date))::int   AS maximo_dias,
        COUNT(*)::int                                               AS total_con_contacto,
        (SELECT COUNT(*)::int FROM prospectos WHERE fecha_primer_contacto IS NULL) AS sin_contacto
      FROM prospectos
      WHERE fecha_primer_contacto IS NOT NULL
        AND creado_en IS NOT NULL
        AND fecha_primer_contacto >= creado_en::date
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE dias < 1)::int        AS menos_24h,
        COUNT(*) FILTER (WHERE dias BETWEEN 1 AND 3)::int AS uno_a_3_dias,
        COUNT(*) FILTER (WHERE dias > 3)::int        AS mas_3_dias
      FROM (
        SELECT (fecha_primer_contacto - creado_en::date) AS dias
        FROM prospectos
        WHERE fecha_primer_contacto IS NOT NULL
          AND creado_en IS NOT NULL
          AND fecha_primer_contacto >= creado_en::date
      ) t
    `),
  ]);

  const g = general.rows[0] ?? {};
  const d = distribucion.rows[0] ?? {};
  const totalContacto = g.total_con_contacto ?? 0;

  return {
    promedio_dias:     g.promedio_dias    ?? null,
    minimo_dias:       g.minimo_dias      ?? null,
    maximo_dias:       g.maximo_dias      ?? null,
    total_con_contacto: totalContacto,
    sin_contacto:      g.sin_contacto     ?? 0,
    distribucion: [
      { label: "< 24h",    valor: d.menos_24h    ?? 0, pct: totalContacto > 0 ? Math.round(((d.menos_24h ?? 0) / totalContacto) * 100) : 0, color: "#22c55e" },
      { label: "1-3 días", valor: d.uno_a_3_dias ?? 0, pct: totalContacto > 0 ? Math.round(((d.uno_a_3_dias ?? 0) / totalContacto) * 100) : 0, color: "#f59e0b" },
      { label: "> 3 días", valor: d.mas_3_dias   ?? 0, pct: totalContacto > 0 ? Math.round(((d.mas_3_dias ?? 0) / totalContacto) * 100) : 0, color: "#ef4444" },
    ],
  };
}

// ─── 3. Forecast de ingresos ponderado ───────────────────────────────────────

const PROB_POR_ESTADO: Record<string, number> = {
  enviada:         0.20,
  en_negociacion:  0.60,
  cerrada_ganada:  1.00,
};

export async function forecastIngresosService() {
  const rows = await pool.query(`
    SELECT
      estado,
      COUNT(*)::int AS cantidad,
      COALESCE(SUM(
        CASE WHEN moneda = 'USD'
          THEN COALESCE(monto_cerrado, monto_propuesto) * tipo_cambio
          ELSE COALESCE(monto_cerrado, monto_propuesto)
        END
      ), 0)::float AS monto_total
    FROM propuestas
    WHERE estado IN ('enviada','en_negociacion','cerrada_ganada')
    GROUP BY estado
  `);

  let totalPonderado = 0;
  let totalSinPonderar = 0;
  const desglose: { estado: string; label: string; cantidad: number; monto_total: number; prob: number; ponderado: number }[] = [];

  const LABELS: Record<string, string> = {
    enviada:        "Enviadas",
    en_negociacion: "En negociación",
    cerrada_ganada: "Cerradas ganadas",
  };

  for (const row of rows.rows) {
    const prob       = PROB_POR_ESTADO[row.estado] ?? 0;
    const ponderado  = row.monto_total * prob;
    totalPonderado  += ponderado;
    totalSinPonderar += row.monto_total;
    desglose.push({
      estado:     row.estado,
      label:      LABELS[row.estado] ?? row.estado,
      cantidad:   row.cantidad,
      monto_total: row.monto_total,
      prob:        prob * 100,
      ponderado,
    });
  }

  return {
    total_ponderado:    Math.round(totalPonderado),
    total_sin_ponderar: Math.round(totalSinPonderar),
    desglose,
  };
}

// ─── 4. Tasa de conversión por etapa del funnel ───────────────────────────────

const ORDEN_ETAPAS = [
  "nuevo", "contactado", "interesado", "propuesta_enviada", "negociacion", "cerrado_ganado",
];

export async function tasaConversionFunnelService() {
  const rows = await pool.query(`
    SELECT
      etapa_pipeline AS etapa,
      COUNT(*)::int  AS total,
      COALESCE(SUM(
        CASE WHEN moneda = 'USD'
          THEN COALESCE(monto_propuesto, 0) * COALESCE(tipo_cambio, 3.7)
          ELSE COALESCE(monto_propuesto, 0)
        END
      ), 0)::numeric AS valor
    FROM prospectos
    GROUP BY etapa_pipeline
  `);

  const mapa:  Record<string, number> = {};
  const valor: Record<string, number> = {};
  for (const r of rows.rows) {
    mapa[r.etapa]  = r.total;
    valor[r.etapa] = parseFloat(r.valor);
  }

  const activos = ORDEN_ETAPAS.map((e) => ({
    etapa: e,
    total: mapa[e]  ?? 0,
    valor: valor[e] ?? 0,
  }));

  const etapas = activos.map((e, i) => {
    const prev = i > 0 ? activos[i - 1].total : null;
    const pct  = prev !== null && prev > 0
      ? Math.round((e.total / prev) * 100)
      : null;
    return { etapa: e.etapa, total: e.total, valor: e.valor, pct_conversion: pct };
  });

  const perdidos    = mapa["perdido"]    ?? 0;
  const descartados = mapa["descartado"] ?? 0;

  const totalEntrada = activos[0].total + perdidos + descartados +
    activos.slice(1).reduce((s, e) => s + e.total, 0);

  const tasaGlobal = totalEntrada > 0
    ? Math.round(((mapa["cerrado_ganado"] ?? 0) / totalEntrada) * 100)
    : 0;

  // KPIs financieros
  const etapasActivas = ["nuevo","contactado","interesado","propuesta_enviada","negociacion"];
  const valorPipeline = etapasActivas.reduce((s, e) => s + (valor[e] ?? 0), 0);
  const valorCerrado  = valor["cerrado_ganado"] ?? 0;
  const tasaCierre    = (perdidos + (mapa["cerrado_ganado"] ?? 0)) > 0
    ? Math.round(((mapa["cerrado_ganado"] ?? 0) / (perdidos + (mapa["cerrado_ganado"] ?? 0))) * 100)
    : 0;

  return {
    etapas,
    perdidos,
    descartados,
    tasa_global:     tasaGlobal,
    valor_pipeline:  valorPipeline,
    valor_cerrado:   valorCerrado,
    tasa_cierre:     tasaCierre,
  };
}

// ─── Efectividad por canal ────────────────────────────────────────────────────

export async function canalEfectividadService() {
  const result = await pool.query(`
    SELECT
      canal,
      COUNT(*)::int                                                   AS total,
      COUNT(*) FILTER (WHERE resultado = 'interesado')::int          AS interesados,
      ROUND(
        COUNT(*) FILTER (WHERE resultado = 'interesado')::numeric
        / NULLIF(COUNT(*), 0) * 100
      )::int AS pct_conversion
    FROM llamadas
    WHERE fecha >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY canal
    HAVING COUNT(*) >= 3
    ORDER BY pct_conversion DESC NULLS LAST
  `);
  return result.rows as {
    canal:          string;
    total:          number;
    interesados:    number;
    pct_conversion: number;
  }[];
}
