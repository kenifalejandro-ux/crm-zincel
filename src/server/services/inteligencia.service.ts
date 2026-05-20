/** src/server/services/inteligencia.service.ts */

import { pool } from "../config/database";

// ─── Actividad comercial KPIs ─────────────────────────────────────────────────

export async function actividadKPIsService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const desde = filters?.fecha_inicio ?? null;
  const hasta = filters?.fecha_fin ?? null;

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
        COALESCE(SUM(monto_cerrado) FILTER (WHERE estado='aceptada'),0)::float AS monto_cerrado
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

  return {
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
}

// ─── Insights automáticos ─────────────────────────────────────────────────────

type TipoInsight = "positivo" | "alerta" | "info" | "oportunidad";
interface Insight { tipo: TipoInsight; titulo: string; texto: string; icono: string; }

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function horaLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export async function insightsAutomaticosService(): Promise<Insight[]> {
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
      });
    } else if (tasa < 30) {
      insights.push({
        tipo: "alerta", icono: "📞",
        titulo: "Baja contactabilidad",
        texto: `Solo ${tasa}% de tus llamadas del último mes fueron contestadas (${ct.contestadas} de ${ct.total}). Puede deberse a horarios inadecuados o lista sin calificar — prueba llamar entre 10am–12pm o enviar un WhatsApp previo.`,
      });
    }
  }

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
}

export async function prioridadOperacionalService(): Promise<AccionPrioridad[]> {
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
    // 5. Leads sin ninguna actividad (nueva captación sin contacto)
    pool.query(`
      SELECT COUNT(*)::int AS n FROM prospectos p
      WHERE etapa_pipeline = 'nuevo'
        AND NOT EXISTS (SELECT 1 FROM llamadas WHERE prospecto_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM reuniones WHERE prospecto_id = p.id)
    `),
  ]);

  const acciones: AccionPrioridad[] = [];

  if (a.rows[0].n > 0) acciones.push({
    nivel: "critica", icono: "🔥",
    titulo: "Enviar propuestas",
    descripcion: `${a.rows[0].n} leads en etapa Interesado/Negociación sin propuesta enviada. Son los más cercanos al cierre.`,
    cantidad: a.rows[0].n,
    accion: "Ver en Pipeline",
  });

  if (b.rows[0].n > 0) acciones.push({
    nivel: "critica", icono: "🚨",
    titulo: "Reactivar negociaciones",
    descripcion: `${b.rows[0].n} lead${b.rows[0].n > 1 ? "s" : ""} en Negociación sin actividad hace más de 7 días. Alta probabilidad de perderlos.`,
    cantidad: b.rows[0].n,
    accion: "Ver en Pipeline",
  });

  if (c.rows[0].n > 0) acciones.push({
    nivel: "urgente", icono: "📋",
    titulo: "Seguimiento de propuestas",
    descripcion: `${c.rows[0].n} propuesta${c.rows[0].n > 1 ? "s" : ""} enviada${c.rows[0].n > 1 ? "s" : ""} sin respuesta en más de 7 días. Un seguimiento aumenta la probabilidad de cierre.`,
    cantidad: c.rows[0].n,
    accion: "Ver propuestas",
  });

  if (d.rows[0].n > 0) acciones.push({
    nivel: "urgente", icono: "📞",
    titulo: "Volver a llamar",
    descripcion: `${d.rows[0].n} lead${d.rows[0].n > 1 ? "s solicitaron" : " solicitó"} ser contactado${d.rows[0].n > 1 ? "s" : ""} de nuevo. Están esperando tu llamada.`,
    cantidad: d.rows[0].n,
    accion: "Ver leads",
  });

  if (e.rows[0].n > 0) acciones.push({
    nivel: "pendiente", icono: "📬",
    titulo: "Leads sin primer contacto",
    descripcion: `${e.rows[0].n} leads nuevos que nunca han recibido una llamada ni reunión. Son oportunidades sin explorar.`,
    cantidad: e.rows[0].n,
    accion: "Ver en Prospectos",
  });

  return acciones;
}

// ─── Leads estancados (lista detallada) ──────────────────────────────────────

export async function leadsEstancadosService(dias = 14) {
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

  return {
    llamadas:  { actual: la, anterior: lant, pct: pct(la, lant) },
    reuniones: { actual: ra, anterior: rant, pct: pct(ra, rant) },
    brochures: { actual: ba, anterior: bant, pct: pct(ba, bant) },
  };
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

  return {
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
}
