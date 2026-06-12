/** src/utils/metricas.calc.ts */

import { Metrica, Plataforma } from "../types/metricas.types";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface MetricasCalculadas {
  // Calculadas
  ctr:               number;
  cpc:               number;
  cpm:               number;
  cpa:               number;
  roas:              number;
  roi:               number;
  frecuencia:        number;
  costo_por_lead:    number;
  costo_por_mensaje: number;
  tasa_conversion:   number;
  tasa_cierre:       number;
  ticket_promedio:   number;
  margen_neto:       number;
  punto_equilibrio:  number;
  // Health Score
  health_score:      number;
  health_label:      "Excelente" | "Buena" | "Regular" | "Crítica";
  health_color:      "green" | "blue" | "yellow" | "red";
  // Funnel
  funnel:            FunnelData;
  // Semáforos
  semaforos:         Record<string, Semaforo>;
  // Proyección
  proyeccion:        ProyeccionData;
}

export interface FunnelData {
  etapas:          FunnelEtapa[];
  cuello_botella:  string | null;
  tasa_global:     number;
}

export interface FunnelEtapa {
  nombre:     string;
  valor:      number;
  porcentaje: number; // vs etapa anterior
  estado:     "green" | "yellow" | "red";
  etiqueta:   string;
}

export interface Semaforo {
  valor:      number;
  estado:     "green" | "yellow" | "red";
  benchmark:  string;
  lectura:    string;
}

export interface ProyeccionData {
  dias:                number;
  gasto_proyectado:    number;
  leads_proyectados:   number;
  ingresos_proyectados:number;
  roas_proyectado:     number;
  presupuesto_meta:    number;
}

// ─── Benchmarks por plataforma ─────────────────────────────────────────────────
// Meta: sector inmobiliario, mercado LatAm Tier 3 (Perú), valores en S/.
// Ajustado -20% respecto a benchmarks USD (WordStream 2025, SuperAds, AdAmigo).
// Lógica evaluarBenchmark: NOT invertido → green>=max, yellow>=min, red<min
//                           invertido     → green<=min, yellow<=max, red>max
const BENCHMARKS: Record<Plataforma, Record<string, { min: number; max: number }>> = {
  meta: {
    ctr:       { min: 2.2,  max: 3.5  }, // % — excelente ≥3.5%, aceptable ≥2.2%
    cpc:       { min: 2.50, max: 4.00 }, // S/ — excelente <2.50, aceptable <4.00
    cpm:       { min: 65,   max: 105  }, // S/ — excelente <65,   aceptable <105
    cpa:       { min: 120,  max: 250  }, // S/ — excelente <120,  aceptable <250
    roas:      { min: 2,    max: 5    }, // x  — excelente ≥5x,   aceptable ≥2x
    frecuencia:{ min: 2.5,  max: 4.0  }, // x  — excelente ≤2.5x, aceptable ≤4x
  },
  google: {
    ctr:       { min: 2,    max: 5    }, // % search
    cpc:       { min: 3,    max: 15   }, // S/ search
    cpm:       { min: 15,   max: 50   }, // S/ display
    cpa:       { min: 30,   max: 100  }, // S/
    roas:      { min: 2,    max: 5    },
    frecuencia:{ min: 1,    max: 5    },
  },
  tiktok: {
    ctr:       { min: 1,    max: 3    }, // %
    cpc:       { min: 1,    max: 4    }, // S/
    cpm:       { min: 15,   max: 45   }, // S/
    cpa:       { min: 20,   max: 80   }, // S/
    roas:      { min: 2,    max: 5    },
    frecuencia:{ min: 1,    max: 4    },
  },
};

// ─── Helper: redondear ──────────────────────────────────────────────────────────
const r = (n: number, decimales = 2): number =>
  Math.round(n * Math.pow(10, decimales)) / Math.pow(10, decimales);

const safe = (n: number): number => (isFinite(n) && !isNaN(n) ? n : 0);

// ─── Helper: semáforo vs benchmark ─────────────────────────────────────────────
const evaluarBenchmark = (
  metrica:    string,
  valor:      number,
  plataforma: Plataforma,
  invertido = false, // true = menor es mejor (CPC, CPM, CPA)
): "green" | "yellow" | "red" => {
  const bench = BENCHMARKS[plataforma]?.[metrica];
  if (!bench) return "green";

  if (!invertido) {
    // Mayor es mejor (CTR, ROAS)
    if (valor >= bench.max)                    return "green";
    if (valor >= bench.min)                    return "yellow";
    return "red";
  } else {
    // Menor es mejor (CPC, CPM, CPA)
    if (valor <= bench.min)                    return "green";
    if (valor <= bench.max)                    return "yellow";
    return "red";
  }
};

// ─── Cálculos principales ───────────────────────────────────────────────────────
export const calcularMetricas = (m: Metrica): MetricasCalculadas => {
  const plataforma = m.plataforma;

  // ── Fórmulas base ─────────────────────────────────────────────────────────
  const ctr               = r(safe(m.clics / m.impresiones * 100));
  const cpc               = r(safe(m.gasto / m.clics));
  const cpm               = r(safe(m.gasto / m.impresiones * 1000));
  const cpa               = r(safe(m.gasto / m.conversiones));
  const roas              = m.gasto > 0 ? r(safe(m.ingresos / m.gasto)) : 0;
  const roi               = m.costo_total > 0
    ? r(safe((m.ingresos - m.costo_total) / m.costo_total * 100))
    : 0;
  const frecuencia        = r(safe(m.impresiones / m.alcance));
  const costo_por_lead    = r(safe(m.gasto / m.leads));
  const costo_por_mensaje = r(safe(m.gasto / m.mensajes));
  const tasa_conversion   = r(safe(m.conversiones / m.clics * 100));
  const tasa_cierre       = r(safe(m.conversiones / m.leads * 100));
  const ticket_promedio   = r(safe(m.ingresos / m.conversiones));
  const margen_neto       = r(m.ingresos - m.costo_total);
  const punto_equilibrio  = r(safe(m.costo_total / ticket_promedio));

  // ── Semáforos ─────────────────────────────────────────────────────────────
  const semaforos: Record<string, Semaforo> = {
    ctr: {
      valor:     ctr,
      estado:    evaluarBenchmark("ctr", ctr, plataforma),
      benchmark: `${BENCHMARKS[plataforma].ctr.min}% - ${BENCHMARKS[plataforma].ctr.max}%`,
      lectura:   generarLectura("ctr", ctr, plataforma, m),
    },
    cpc: {
      valor:     cpc,
      estado:    evaluarBenchmark("cpc", cpc, plataforma, true),
      benchmark: `S/ ${BENCHMARKS[plataforma].cpc.min} - S/ ${BENCHMARKS[plataforma].cpc.max}`,
      lectura:   generarLectura("cpc", cpc, plataforma, m),
    },
    cpm: {
      valor:     cpm,
      estado:    evaluarBenchmark("cpm", cpm, plataforma, true),
      benchmark: `S/ ${BENCHMARKS[plataforma].cpm.min} - S/ ${BENCHMARKS[plataforma].cpm.max}`,
      lectura:   generarLectura("cpm", cpm, plataforma, m),
    },
    cpa: {
      valor:     cpa,
      estado:    evaluarBenchmark("cpa", cpa, plataforma, true),
      benchmark: `S/ ${BENCHMARKS[plataforma].cpa.min} - S/ ${BENCHMARKS[plataforma].cpa.max}`,
      lectura:   generarLectura("cpa", cpa, plataforma, m),
    },
    roas: {
      valor:     roas,
      estado:    evaluarBenchmark("roas", roas, plataforma),
      benchmark: `Mínimo 2x para ser rentable`,
      lectura:   generarLectura("roas", roas, plataforma, m),
    },
    frecuencia: {
      valor:     frecuencia,
      estado:    evaluarBenchmark("frecuencia", frecuencia, plataforma, true),
      benchmark: `${BENCHMARKS[plataforma].frecuencia.min}x - ${BENCHMARKS[plataforma].frecuencia.max}x`,
      lectura:   generarLectura("frecuencia", frecuencia, plataforma, m),
    },
  };

  // ── Health Score ──────────────────────────────────────────────────────────
  const { health_score, health_label, health_color } = calcularHealthScore(semaforos, roas, roi);

  // ── Funnel ────────────────────────────────────────────────────────────────
  const funnel = calcularFunnel(m, ctr, tasa_conversion, tasa_cierre);

  // ── Proyección a 30 días ──────────────────────────────────────────────────
  const proyeccion = calcularProyeccion(m, roas);

  return {
    ctr, cpc, cpm, cpa, roas, roi,
    frecuencia, costo_por_lead, costo_por_mensaje,
    tasa_conversion, tasa_cierre, ticket_promedio,
    margen_neto, punto_equilibrio,
    health_score, health_label, health_color,
    funnel, semaforos, proyeccion,
  };
};

// ─── Health Score ───────────────────────────────────────────────────────────────
const calcularHealthScore = (
  semaforos:  Record<string, Semaforo>,
  roas:       number,
  roi:        number,
): { health_score: number; health_label: "Excelente"|"Buena"|"Regular"|"Crítica"; health_color: "green"|"blue"|"yellow"|"red" } => {
  const puntajes = Object.values(semaforos).map((s) =>
    s.estado === "green" ? 100 : s.estado === "yellow" ? 60 : 20
  );

  // Bonus por ROAS y ROI positivo
  if (roas >= 3)  puntajes.push(100);
  else if (roas >= 2) puntajes.push(60);
  else puntajes.push(20);

  if (roi > 0)    puntajes.push(100);
  else            puntajes.push(20);

  const score = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);

  if (score >= 80) return { health_score: score, health_label: "Excelente", health_color: "green"  };
  if (score >= 60) return { health_score: score, health_label: "Buena",     health_color: "blue"   };
  if (score >= 40) return { health_score: score, health_label: "Regular",   health_color: "yellow" };
  return             { health_score: score, health_label: "Crítica",   health_color: "red"    };
};

// ─── Funnel ─────────────────────────────────────────────────────────────────────
const calcularFunnel = (
  m:               Metrica,
  ctr:             number,
  tasa_conversion: number,
  tasa_cierre:     number,
): FunnelData => {
  const etapas: FunnelEtapa[] = [
    {
      nombre:     "Impresiones",
      valor:      m.impresiones,
      porcentaje: 100,
      estado:     "green",
      etiqueta:   "TOFU",
    },
    {
      nombre:     "Alcance",
      valor:      m.alcance,
      porcentaje: r(safe(m.alcance / m.impresiones * 100)),
      estado:     m.alcance / m.impresiones >= 0.5 ? "green" : "yellow",
      etiqueta:   "TOFU",
    },
    {
      nombre:     "Clics",
      valor:      m.clics,
      porcentaje: ctr,
      estado:     ctr >= 1.5 ? "green" : ctr >= 0.9 ? "yellow" : "red",
      etiqueta:   "MOFU",
    },
    {
      nombre:     "Mensajes",
      valor:      m.mensajes,
      porcentaje: r(safe(m.mensajes / m.clics * 100)),
      estado:     m.mensajes / m.clics >= 0.2 ? "green" : m.mensajes / m.clics >= 0.1 ? "yellow" : "red",
      etiqueta:   "MOFU",
    },
    {
      nombre:     "Leads",
      valor:      m.leads,
      porcentaje: r(safe(m.leads / m.clics * 100)),
      estado:     m.leads / m.clics >= 0.05 ? "green" : m.leads / m.clics >= 0.02 ? "yellow" : "red",
      etiqueta:   "DOFU",
    },
    {
      nombre:     "Conversiones",
      valor:      m.conversiones,
      porcentaje: tasa_conversion,
      estado:     tasa_conversion >= 3 ? "green" : tasa_conversion >= 1 ? "yellow" : "red",
      etiqueta:   "BOFU",
    },
    {
      nombre:     "Ventas",
      valor:      m.ingresos,
      porcentaje: r(safe(m.conversiones / m.leads * 100)),
      estado:     tasa_cierre >= 30 ? "green" : tasa_cierre >= 10 ? "yellow" : "red",
      etiqueta:   "REVENUE",
    },
  ];

  // Detectar cuello de botella — la etapa con peor caída
  const cuello = etapas
    .filter((e) => e.estado === "red")
    .sort((a, b) => a.porcentaje - b.porcentaje)[0];

  const tasa_global = r(safe(m.conversiones / m.impresiones * 100));

  return {
    etapas,
    cuello_botella: cuello?.nombre ?? null,
    tasa_global,
  };
};

// ─── Proyección ─────────────────────────────────────────────────────────────────
const calcularProyeccion = (m: Metrica, roas: number): ProyeccionData => {
  // Calcular días del período
  const inicio = new Date(m.periodo_inicio);
  const fin    = new Date(m.periodo_fin);
  const dias   = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));

  const gasto_dia    = m.gasto       / dias;
  const leads_dia    = m.leads       / dias;
  const ingresos_dia = m.ingresos    / dias;

  const DIAS_PROYECCION = 30;

  return {
    dias:                 DIAS_PROYECCION,
    gasto_proyectado:     r(gasto_dia    * DIAS_PROYECCION),
    leads_proyectados:    Math.round(leads_dia * DIAS_PROYECCION),
    ingresos_proyectados: r(ingresos_dia * DIAS_PROYECCION),
    roas_proyectado:      roas,
    presupuesto_meta:     r(gasto_dia    * DIAS_PROYECCION * 1.2), // +20% para escalar
  };
};

// ─── Lecturas interpretativas ───────────────────────────────────────────────────
const generarLectura = (
  metrica:    string,
  valor:      number,
  plataforma: Plataforma,
  m:          Metrica,
): string => {
  const bench = BENCHMARKS[plataforma];

  switch (metrica) {
    case "ctr":
      if (valor === 0) return "Sin datos suficientes para evaluar el CTR.";
      if (valor >= bench.ctr.max)
        return `Tu CTR de ${valor}% está por encima del promedio. Por cada 100 personas que ven tu anuncio, ${valor} hacen clic. Excelente creatividad.`;
      if (valor >= bench.ctr.min)
        return `Tu CTR de ${valor}% está dentro del promedio del mercado. Por cada 100 personas, ${valor} hacen clic. Puedes mejorar el copy o la imagen.`;
      return `Tu CTR de ${valor}% está por debajo del promedio (${bench.ctr.min}%-${bench.ctr.max}%). El anuncio no está enganchando. Revisa la creatividad, el copy y la segmentación.`;

    case "cpc":
      if (valor === 0) return "Sin datos suficientes para evaluar el CPC.";
      if (valor <= bench.cpc.min)
        return `Tu CPC de S/ ${valor} es excelente. Cada clic te cuesta menos de S/ ${bench.cpc.min}, muy por debajo del promedio.`;
      if (valor <= bench.cpc.max)
        return `Tu CPC de S/ ${valor} está dentro del rango normal (S/ ${bench.cpc.min} - S/ ${bench.cpc.max}). Cada clic tiene un costo razonable.`;
      return `Tu CPC de S/ ${valor} es alto. Cada clic te cuesta más de S/ ${bench.cpc.max}. Revisa la segmentación de audiencia y la competencia en la subasta.`;

    case "cpm":
      if (valor === 0) return "Sin datos suficientes para evaluar el CPM.";
      if (valor <= bench.cpm.min)
        return `Tu CPM de S/ ${valor} es muy eficiente. Estás pagando poco por cada 1,000 impresiones, tu audiencia no está saturada.`;
      if (valor <= bench.cpm.max)
        return `Tu CPM de S/ ${valor} está dentro del promedio. Por cada 1,000 veces que se muestra tu anuncio pagas S/ ${valor}.`;
      return `Tu CPM de S/ ${valor} es elevado. La audiencia puede estar saturada o la competencia es alta. Considera ampliar o cambiar el público objetivo.`;

    case "cpa":
      if (valor === 0) return "Sin datos suficientes para evaluar el CPA.";
      if (valor <= bench.cpa.min)
        return `Tu CPA de S/ ${valor} es excelente. Cada conversión te cuesta muy poco. Si tu margen supera ese valor, la campaña es muy rentable.`;
      if (valor <= bench.cpa.max)
        return `Tu CPA de S/ ${valor} está dentro del rango. Cada conversión tiene un costo razonable. Compara con tu margen de ganancia para confirmar rentabilidad.`;
      return `Tu CPA de S/ ${valor} es alto. Cada conversión te cuesta más de lo normal. Revisa el proceso de conversión y la calidad de la audiencia.`;

    case "roas":
      if (valor === 0) return "Sin ingresos registrados. Agrega los ingresos de la campaña para calcular el ROAS.";
      if (valor >= 4)
        return `Tu ROAS de ${valor}x es excelente. Por cada S/ 1 invertido recuperas S/ ${valor} en ventas. Esta campaña merece escalar el presupuesto.`;
      if (valor >= 2)
        return `Tu ROAS de ${valor}x es positivo. Por cada S/ 1 invertido recuperas S/ ${valor}. La campaña es rentable pero tiene margen de mejora.`;
      if (valor >= 1)
        return `Tu ROAS de ${valor}x es bajo. Estás recuperando lo invertido pero sin ganancia real. Optimiza la campaña o revisa el precio de venta.`;
      return `Tu ROAS de ${valor}x indica que estás perdiendo dinero. Por cada S/ 1 invertido solo recuperas S/ ${valor}. Pausa y restructura la campaña.`;

    case "frecuencia":
      if (valor === 0) return "Sin datos suficientes para evaluar la frecuencia.";
      if (valor <= bench.frecuencia.max)
        return `Tu frecuencia de ${valor}x es saludable. Cada persona ve tu anuncio ${valor} veces en promedio, suficiente para recordarlo sin saturarse.`;
      return `Tu frecuencia de ${valor}x es alta. Las personas ven tu anuncio demasiadas veces. La audiencia puede estar saturada — considera ampliar el público o rotar creatividades.`;

    default:
      return "";
  }
};

// ─── Calcular en tiempo real desde el formulario ───────────────────────────────
export interface CamposCalculadosForm {
  ctr:               string;
  cpc:               string;
  cpm:               string;
  cpa:               string;
  roas:              string;
  roi:               string;
  frecuencia:        string;
  costo_por_mensaje: string;
  costo_por_lead:    string;
}

export const calcularDesdeForm = (form: Record<string, string>): CamposCalculadosForm => {
  const n = (k: string) => parseFloat(form[k]) || 0;

  const impresiones  = n("impresiones");
  const clics        = n("clics");
  const gasto        = n("gasto");
  const conversiones = n("conversiones");
  const ingresos     = n("ingresos");
  const costo_total  = n("costo_total");
  const alcance      = n("alcance");
  const mensajes     = n("mensajes");
  const leads        = n("leads");

  return {
    ctr:               String(r(safe(clics        / impresiones  * 100))),
    cpc:               String(r(safe(gasto        / clics))),
    cpm:               String(r(safe(gasto        / impresiones  * 1000))),
    cpa:               String(r(safe(gasto        / conversiones))),
    roas:              String(r(safe(ingresos      / gasto))),
    roi:               String(r(safe((ingresos - costo_total) / costo_total * 100))),
    frecuencia:        String(r(safe(impresiones  / alcance))),
    costo_por_mensaje: String(r(safe(gasto        / mensajes))),
    costo_por_lead:    String(r(safe(gasto        / leads))),
  };
};