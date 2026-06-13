/** client/src/components/metricas/ComparativaTab.tsx */

import { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Award, Target, BarChart2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { Metrica } from "../../types/metricas.types";
import type { BenchmarkSector } from "../../types/benchmark.types";
import type { Resultado } from "../../types/resultado.types";
import { getBenchmarkPorEmpresa } from "../../services/benchmarks.api";
import { listarResultados } from "../../services/resultados.api";
import { sectorLabel } from "../../utils/sectores";
import { COLORS, GLASS_BASE, BADGE_BASE, PANEL_BASE } from "../../lib/tokens";

interface Props { metricas: Metrica[]; empresa?: string }

type Vista       = "campana" | "mes" | "anio";
type MetricaVista = "gasto" | "cpl" | "ctr" | "mensajes";


const FMT_SOL = (v: number) => `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const FMT_PCT = (v: number) => `${v.toFixed(2)}%`;

// ── Definición de benchmark ──────────────────────────────────────────────────
interface BenchmarkDef {
  key:            string;
  label:          string;
  unidad:         "%" | "sol" | "x";
  excelente:      { min: number | null; max: number | null };
  aceptable:      { min: number | null; max: number | null };
  descripcion:    string;
  mayor_es_mejor: boolean;
  fuente:         string;
}

// Benchmarks inmobiliaria Meta Ads — ajustado -20% para LatAm/Perú
// Fuentes: WordStream 2024-2025, SuperAds, AdAmigo
const BENCHMARKS_INMOBILIARIA: BenchmarkDef[] = [
  {
    key: "ctr", label: "CTR", unidad: "%",
    excelente: { min: 3.5,  max: null  }, aceptable: { min: 2.2,  max: 3.49  },
    descripcion: "Tasa de clic — qué tan atractivo es el anuncio",
    mayor_es_mejor: true,
    fuente: "WordStream 2025 · SuperAds Real Estate",
  },
  {
    key: "cpc", label: "CPC", unidad: "sol",
    excelente: { min: null, max: 2.50  }, aceptable: { min: null, max: 4.00  },
    descripcion: "Costo por clic — eficiencia del tráfico generado",
    mayor_es_mejor: false,
    fuente: "WordStream 2025 · SuperAds Real Estate CPC",
  },
  {
    key: "cpm", label: "CPM", unidad: "sol",
    excelente: { min: null, max: 65    }, aceptable: { min: null, max: 105   },
    descripcion: "Costo por 1,000 impresiones — precio de visibilidad",
    mayor_es_mejor: false,
    fuente: "SuperAds Real Estate CPM · AdAmigo 2026",
  },
  {
    key: "cpl", label: "CPL", unidad: "sol",
    excelente: { min: null, max: 80    }, aceptable: { min: null, max: 200   },
    descripcion: "Costo por lead — campañas con Instant Form",
    mayor_es_mejor: false,
    fuente: "WordStream 2025 · SuperAds CPL · AdAmigo 2026",
  },
  {
    key: "cpa", label: "CPA", unidad: "sol",
    excelente: { min: null, max: 120   }, aceptable: { min: null, max: 250   },
    descripcion: "Costo por conversión — campañas con pixel activo",
    mayor_es_mejor: false,
    fuente: "WordStream 2025 · Meta Business benchmarks",
  },
  {
    key: "roas", label: "ROAS", unidad: "x",
    excelente: { min: 5,    max: null  }, aceptable: { min: 2,    max: null  },
    descripcion: "Retorno sobre inversión publicitaria",
    mayor_es_mejor: true,
    fuente: "Trendtrack · Meta Business benchmarks",
  },
  {
    key: "roi", label: "ROI", unidad: "%",
    excelente: { min: 200,  max: null  }, aceptable: { min: 100,  max: null  },
    descripcion: "Retorno sobre inversión total — (ingresos − costo_total) / costo_total",
    mayor_es_mejor: true,
    fuente: "Trendtrack · Meta Business benchmarks",
  },
  {
    key: "frecuencia", label: "Frecuencia", unidad: "x",
    excelente: { min: 1.5,  max: 2.5   }, aceptable: { min: null, max: 4.0  },
    descripcion: "Veces que una persona ve el anuncio — >4 genera fatiga",
    mayor_es_mejor: false,
    fuente: "Meta Ads official guidance",
  },
];

// Aplica valores dinámicos de BD sobre los defaults estáticos
function aplicarDinamico(defs: BenchmarkDef[], din: BenchmarkSector | null): BenchmarkDef[] {
  if (!din) return defs;
  return defs.map((b) => {
    const rawExc = (din as any)[`${b.key}_excelente`];
    const rawAce = (din as any)[`${b.key}_aceptable`];
    const exc: number | null = rawExc != null ? Number(rawExc) : null;
    const ace: number | null = rawAce != null ? Number(rawAce) : null;
    if (exc === null && ace === null) return b;
    const newExc: BenchmarkDef["excelente"] = b.mayor_es_mejor
      ? { min: exc ?? b.excelente.min, max: null }
      : { min: null, max: exc ?? b.excelente.max };
    const newAce: BenchmarkDef["aceptable"] = b.mayor_es_mejor
      ? { min: ace ?? b.aceptable.min, max: null }
      : { min: null, max: ace ?? b.aceptable.max };
    return { ...b, excelente: newExc, aceptable: newAce, fuente: din.fuente ?? b.fuente };
  });
}

const FUENTES_URLS = [
  { label: "WordStream Facebook Ads Benchmarks 2025",       url: "https://www.wordstream.com/blog/facebook-ads-benchmarks-2025" },
  { label: "SuperAds Real Estate CPL Benchmarks",           url: "https://www.superads.ai/facebook-ads-costs/cost-per-lead/real-estate" },
  { label: "SuperAds Real Estate CTR Benchmarks",           url: "https://www.superads.ai/facebook-ads-costs/ctr-click-through-rate/real-estate" },
  { label: "SuperAds Real Estate CPC Benchmarks",           url: "https://www.superads.ai/facebook-ads-costs/cpc-cost-per-click/real-estate" },
  { label: "SuperAds Real Estate CPM Benchmarks",           url: "https://www.superads.ai/facebook-ads-costs/cpm-cost-per-mille/real-estate" },
  { label: "AdAmigo Meta Ads Benchmarks 2025 by Industry",  url: "https://www.adamigo.ai/blog/meta-ads-benchmarks-2025-by-industry" },
  { label: "Trendtrack — Average ROAS for Facebook Ads",    url: "https://www.trendtrack.io/blog-post/what-is-the-average-roas-for-facebook-ads" },
];

const CPL_VERDE_DEFAULT    = 80;
const CPL_AMARILLO_DEFAULT = 200;

// ── Benchmarks de rentabilidad de ventas — por sector ────────────────────────
// Métricas: pctCosto (% del valor vendido que debería costar la inversión)
//           roasVenta (valor_vendido / inversión_total_comercial)
// Estas son distintas a las métricas de anuncio (CTR/CPL/CPC) — miden si
// el gasto total fue rentable respecto al valor de la propiedad/proyecto vendido.
interface BenchmarkVentaSector {
  label:     string;
  pctCosto:  { excelente: number; aceptable: number }; // ≤ X% del valor vendido
  roasVenta: { excelente: number; aceptable: number }; // ≥ Xx sobre inversión
  ejemploS:  number;   // precio referencial de unidad en soles (para ejemplificar)
  fuentes:   { label: string; url: string }[];
}

const BENCHMARKS_VENTA_SECTOR: Record<string, BenchmarkVentaSector> = {
  inmobiliaria: {
    label: "Inmobiliaria residencial",
    pctCosto:  { excelente: 2, aceptable: 5 },
    roasVenta: { excelente: 20, aceptable: 8 },
    ejemploS:  120_000,
    // Lectura: para un depa de S/120k, inversión excelente ≤ S/2,400 (ROAS 50x).
    // Aceptable ≤ S/6,000 (ROAS 20x). Sobre 5% = por mejorar.
    // En inmobiliaria el ticket alto justifica ROAS elevados:
    // S/5,000 en ads para vender un inmueble de S/200k = ROAS 40x = Excelente.
    fuentes: [
      { label: "NAR Profile of Home Buyers and Sellers 2024", url: "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-profile-of-home-buyers-and-sellers" },
      { label: "Meta Real Estate Industry Insights 2025",      url: "https://www.facebook.com/business/industries/real-estate" },
      { label: "HubSpot State of Marketing 2025 — Real Estate", url: "https://www.hubspot.com/state-of-marketing" },
      { label: "Properati LatAm Real Estate Marketing Study 2024", url: "https://properati.com" },
      { label: "ASEI Asociación de Empresas Inmobiliarias del Perú", url: "https://asei.com.pe" },
    ],
  },
  construccion: {
    label: "Construcción e ingeniería",
    pctCosto:  { excelente: 3, aceptable: 8 },
    roasVenta: { excelente: 12, aceptable: 5 },
    ejemploS:  500_000,
    fuentes: [
      { label: "ENR Top 500 Contractors Marketing Report 2024", url: "https://www.enr.com/toplists" },
      { label: "AGC Construction Industry Marketing Benchmarks 2025", url: "https://www.agc.org" },
      { label: "HubSpot Construction Marketing Report 2025", url: "https://www.hubspot.com/state-of-marketing" },
    ],
  },
  tecnologia: {
    label: "Tecnología / SaaS",
    pctCosto:  { excelente: 8, aceptable: 20 },
    roasVenta: { excelente: 8, aceptable: 3 },
    ejemploS:  50_000,
    fuentes: [
      { label: "OpenView SaaS Benchmarks 2024", url: "https://openviewpartners.com/saas-benchmarks" },
      { label: "SaaS Capital Metrics Report 2025", url: "https://www.saas-capital.com" },
    ],
  },
  retail: {
    label: "Retail / Comercio",
    pctCosto:  { excelente: 5, aceptable: 12 },
    roasVenta: { excelente: 10, aceptable: 4 },
    ejemploS:  5_000,
    fuentes: [
      { label: "NRF Retail Marketing Benchmarks 2024", url: "https://nrf.com" },
      { label: "Shopify Commerce Trends Report 2025", url: "https://www.shopify.com/research" },
    ],
  },
  educacion: {
    label: "Educación / Capacitación",
    pctCosto:  { excelente: 10, aceptable: 25 },
    roasVenta: { excelente: 6, aceptable: 3 },
    ejemploS:  8_000,
    fuentes: [
      { label: "HubSpot Education Marketing Report 2025", url: "https://www.hubspot.com/state-of-marketing" },
      { label: "Wordstream Education Ads Benchmarks 2025", url: "https://www.wordstream.com/blog/facebook-ads-benchmarks-2025" },
    ],
  },
};

const BENCHMARK_VENTA_DEFAULT: BenchmarkVentaSector = {
  label: "Industria general",
  pctCosto:  { excelente: 5, aceptable: 12 },
  roasVenta: { excelente: 8, aceptable: 3 },
  ejemploS:  50_000,
  fuentes: [
    { label: "HubSpot State of Marketing 2025", url: "https://www.hubspot.com/state-of-marketing" },
    { label: "Gartner CMO Spend Survey 2024", url: "https://www.gartner.com/en/marketing" },
  ],
};

function estadoBenchmark(valor: number, b: BenchmarkDef): "excelente" | "aceptable" | "alto" {
  if (b.mayor_es_mejor) {
    if (b.excelente.min !== null && valor >= b.excelente.min) return "excelente";
    if (b.aceptable.min !== null && valor >= b.aceptable.min) return "aceptable";
    return "alto";
  } else {
    if (b.excelente.max !== null && valor <= b.excelente.max) return "excelente";
    if (b.aceptable.max !== null && valor <= b.aceptable.max) return "aceptable";
    return "alto";
  }
}

function desviacionPct(valor: number, b: BenchmarkDef): { pct: number; texto: string } {
  const ref = b.mayor_es_mejor
    ? (b.excelente.min ?? b.aceptable.min ?? 0)
    : (b.excelente.max ?? b.aceptable.max ?? 1);
  if (!ref) return { pct: 0, texto: "—" };
  const pct = ((valor - ref) / ref) * 100;
  const signo = pct >= 0 ? "+" : "";
  return { pct, texto: `${signo}${pct.toFixed(1)}%` };
}

export function ComparativaTab({ metricas, empresa }: Props) {
  const [benchmarkDin,       setBenchmarkDin]       = useState<BenchmarkSector | null>(null);
  const [sectorActivo,        setSectorActivo]        = useState<string | null>(null);
  const [chartsMounted,       setChartsMounted]       = useState(false);
  const [vista,               setVista]               = useState<Vista>("mes");
  const [metricaActiva,       setMetricaActiva]       = useState<MetricaVista>("gasto");
  const [resultados,          setResultados]          = useState<Resultado[]>([]);

  useEffect(() => { setChartsMounted(true); }, []);

  // Si no hay empresa explícita pero todas las métricas son de una sola empresa, usarla
  const empresaEfectiva = useMemo(() => {
    if (empresa) return empresa;
    const unicas = [...new Set(metricas.map((m) => m.empresa).filter(Boolean))];
    return unicas.length === 1 ? unicas[0] : null;
  }, [empresa, metricas]);

  useEffect(() => {
    if (!empresaEfectiva) { setBenchmarkDin(null); setSectorActivo(null); return; }
    getBenchmarkPorEmpresa(empresaEfectiva)
      .then((b) => { setBenchmarkDin(b); setSectorActivo(b?.sector ?? null); })
      .catch(() => { setBenchmarkDin(null); setSectorActivo(null); });
  }, [empresaEfectiva]);

  // Carga ventas registradas para cruzar con métricas
  useEffect(() => {
    if (!empresaEfectiva) { setResultados([]); return; }
    listarResultados({ empresa: empresaEfectiva })
      .then(setResultados)
      .catch(() => setResultados([]));
  }, [empresaEfectiva]);

  const benchmarksActivos = useMemo(
    () => aplicarDinamico(BENCHMARKS_INMOBILIARIA, benchmarkDin),
    [benchmarkDin]
  );

  const cplVerde    = useMemo(
    () => benchmarksActivos.find((b) => b.key === "cpl")?.excelente.max ?? CPL_VERDE_DEFAULT,
    [benchmarksActivos]
  );
  const cplAmarillo = useMemo(
    () => benchmarksActivos.find((b) => b.key === "cpl")?.aceptable.max ?? CPL_AMARILLO_DEFAULT,
    [benchmarksActivos]
  );
  const cplBgColor = (cpl: number): string =>
    cpl <= Number(cplVerde) ? "#16a34a" : cpl <= Number(cplAmarillo) ? "#f59e0b" : "#ef4444";

  // ── Ranking (para highlights) ─────────────────────────────────────────────
  const ranking = useMemo(() => {
    return [...metricas]
      .map((m) => ({
        ...m,
        cpl: Number(m.leads) > 0 ? Number(m.gasto) / Number(m.leads) : null,
      }))
      .sort((a, b) => {
        if (a.cpl === null) return 1;
        if (b.cpl === null) return -1;
        return a.cpl - b.cpl;
      });
  }, [metricas]);

  // ── Tendencia CPL + regresión lineal ─────────────────────────────────────────
  const { tendenciaCpl, tendenciaSlope } = useMemo(() => {
    const puntos = metricas
      .filter((m) => Number(m.leads) > 0)
      .map((m) => {
        const nombre = m.campana_nombre ?? "—";
        return {
          nombre: nombre.length > 20 ? nombre.slice(0, 20) + "…" : nombre,
          cpl:    Math.round(Number(m.gasto) / Number(m.leads)),
          fecha:  m.periodo_inicio,
        };
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Regresión lineal simple sobre índice (x) vs CPL (y)
    const n = puntos.length;
    if (n < 2) return { tendenciaCpl: puntos, tendenciaSlope: 0 };
    const xs = puntos.map((_, i) => i);
    const ys = puntos.map((p) => p.cpl);
    const sumX  = xs.reduce((a, b) => a + b, 0);
    const sumY  = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const inter = (sumY - slope * sumX) / n;

    const tendenciaCpl = puntos.map((p, i) => ({
      ...p,
      tendencia: Math.round(inter + slope * i),
    }));

    return { tendenciaCpl, tendenciaSlope: slope };
  }, [metricas]);


  const mejorCpl    = ranking.find((m) => m.cpl !== null);
  const mejorCtr    = [...metricas].sort((a, b) => Number(b.ctr)   - Number(a.ctr))[0];
  const mayorGasto  = [...metricas].sort((a, b) => Number(b.gasto) - Number(a.gasto))[0];

  // ── Valores agregados para diagnóstico ───────────────────────────────────────
  const valoresAgregados = useMemo(() => {
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const conLeads = metricas.filter((m) => Number(m.leads) > 0);
    return {
      ctr:        avg(metricas.map((m) => Number(m.ctr)).filter((v) => v > 0)),
      cpc:        avg(metricas.map((m) => Number(m.cpc)).filter((v) => v > 0)),
      cpm:        avg(metricas.map((m) => Number(m.cpm)).filter((v) => v > 0)),
      cpl:        conLeads.length
                    ? conLeads.reduce((a, m) => a + Number(m.gasto), 0) /
                      conLeads.reduce((a, m) => a + Number(m.leads), 0)
                    : null,
      cpa:        avg(metricas.map((m) => Number(m.cpa)).filter((v) => v > 0)),
      roas:       avg(metricas.map((m) => Number(m.roas)).filter((v) => v > 0)),
      roi:        avg(metricas.map((m) => Number(m.roi)).filter((v) => v !== 0)),
      frecuencia: avg(metricas.map((m) => Number(m.frecuencia)).filter((v) => v > 0)),
    };
  }, [metricas]);

  // ── Datos agrupados según vista ──────────────────────────────────────────────
  const datosVista = useMemo(() => {
    if (vista === "campana") {
      return metricas.map((m) => {
        const nombre = m.campana_nombre ?? "—";
        return {
          nombre:   nombre.length > 24 ? nombre.slice(0, 24) + "…" : nombre,
          gasto:    Number(m.gasto),
          cpl:      Number(m.leads) > 0 ? Number(m.gasto) / Number(m.leads) : null,
          ctr:      Number(m.impresiones) > 0 ? (Number(m.clics) / Number(m.impresiones)) * 100 : 0,
          mensajes: Number(m.mensajes),
          leads:    Number(m.leads),
        };
      }).sort((a, b) => b.gasto - a.gasto);
    }
    const mapa = new Map<string, { gasto: number; leads: number; mensajes: number; clics: number; impresiones: number }>();
    for (const m of metricas) {
      const fecha = new Date(m.periodo_inicio);
      const key   = vista === "mes"
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
        : `${fecha.getFullYear()}`;
      const prev = mapa.get(key) ?? { gasto: 0, leads: 0, mensajes: 0, clics: 0, impresiones: 0 };
      mapa.set(key, {
        gasto:       prev.gasto       + Number(m.gasto),
        leads:       prev.leads       + Number(m.leads),
        mensajes:    prev.mensajes    + Number(m.mensajes),
        clics:       prev.clics       + Number(m.clics),
        impresiones: prev.impresiones + Number(m.impresiones),
      });
    }
    return Array.from(mapa.entries())
      .map(([nombre, d]) => ({
        nombre,
        gasto:    d.gasto,
        cpl:      d.leads > 0 ? d.gasto / d.leads : null,
        ctr:      d.impresiones > 0 ? (d.clics / d.impresiones) * 100 : 0,
        mensajes: d.mensajes,
        leads:    d.leads,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [metricas, vista]);

  // Filtra nulos para la métrica activa (CPL sin leads no se grafica)
  const datosChart = useMemo(
    () => metricaActiva === "cpl" ? datosVista.filter((d) => d.cpl !== null) : datosVista,
    [datosVista, metricaActiva]
  );

  // Resumen global para las cards — misma lógica que valoresAgregados para consistencia
  const resumenTotal = useMemo(() => {
    const conLeads  = metricas.filter((m) => Number(m.leads) > 0);
    const ctrVals   = metricas.map((m) => Number(m.ctr)).filter((v) => v > 0);
    return {
      gasto:    metricas.reduce((a, m) => a + Number(m.gasto), 0),
      mensajes: metricas.reduce((a, m) => a + Number(m.mensajes), 0),
      cpl:      conLeads.length > 0
                  ? conLeads.reduce((a, m) => a + Number(m.gasto), 0) / conLeads.reduce((a, m) => a + Number(m.leads), 0)
                  : null,
      ctr:      ctrVals.length > 0 ? ctrVals.reduce((a, b) => a + b, 0) / ctrVals.length : 0,
    };
  }, [metricas]);

  // Umbrales CTR dinámicos desde benchmarksActivos
  const ctrExcelente = useMemo(() => Number(benchmarksActivos.find((b) => b.key === "ctr")?.excelente.min ?? 3.5), [benchmarksActivos]);
  const ctrAceptable = useMemo(() => Number(benchmarksActivos.find((b) => b.key === "ctr")?.aceptable.min ?? 2.2), [benchmarksActivos]);

  // Alerta declive CTR (siempre por mes, independiente de la vista)
  const alertaDeclive = useMemo(() => {
    const mapa = new Map<string, { clics: number; impresiones: number }>();
    for (const m of metricas) {
      const fecha = new Date(m.periodo_inicio);
      const key   = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      const prev  = mapa.get(key) ?? { clics: 0, impresiones: 0 };
      mapa.set(key, { clics: prev.clics + Number(m.clics), impresiones: prev.impresiones + Number(m.impresiones) });
    }
    const meses = Array.from(mapa.entries())
      .map(([periodo, d]) => ({ periodo, ctr: d.impresiones > 0 ? (d.clics / d.impresiones) * 100 : 0 }))
      .filter((p) => p.ctr > 0)
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
    if (meses.length < 2) return null;
    const ult = meses.slice(-2);
    if (ult[1].ctr < ult[0].ctr) {
      const caida = (((ult[0].ctr - ult[1].ctr) / ult[0].ctr) * 100).toFixed(1);
      return { desde: ult[0].periodo, hasta: ult[1].periodo, caida };
    }
    return null;
  }, [metricas]);

  // ── Cruce de ventas registradas con métricas ────────────────────────────────
  const retornoAtribuido = useMemo(() => {
    if (!resultados.length) return null;

    const porCampana = new Map<string, {
      nombre: string; ventas: number; ingresos: number; costoVenta: number; gasto: number; proyecto: string[];
    }>();

    for (const r of resultados) {
      if (!r.metrica_id) continue;   // sin métrica atribuida → no se agrega a la campaña
      const metrica   = metricas.find((m) => m.id === r.metrica_id);
      const gasto     = metrica ? Number(metrica.gasto) : 0;
      const prev      = porCampana.get(r.metrica_id) ?? { nombre: r.campana_nombre, ventas: 0, ingresos: 0, costoVenta: 0, gasto, proyecto: [] };
      const proyecto  = r.proyecto && !prev.proyecto.includes(r.proyecto) ? [...prev.proyecto, r.proyecto] : prev.proyecto;
      porCampana.set(r.metrica_id, {
        nombre:     prev.nombre,
        ventas:     prev.ventas + 1,
        ingresos:   prev.ingresos + Number(r.monto),
        costoVenta: prev.costoVenta + Number(r.costo_venta),
        gasto:      prev.gasto,
        proyecto,
      });
    }

    const campanas        = Array.from(porCampana.values());
    const totalVentas     = campanas.reduce((a, c) => a + c.ventas, 0);
    const totalIngresos   = campanas.reduce((a, c) => a + c.ingresos, 0);
    const totalHonorarios = campanas.reduce((a, c) => a + c.costoVenta, 0);
    const totalGasto      = campanas.reduce((a, c) => a + c.gasto, 0);
    const totalCostoTotal = totalGasto + totalHonorarios;

    return {
      totalVentas,
      totalIngresos,
      totalGasto,
      totalHonorarios,
      totalCostoTotal,
      costoPorVenta:      totalVentas > 0     ? totalCostoTotal / totalVentas         : null,
      pctCostoComercial:  totalIngresos > 0   ? (totalCostoTotal / totalIngresos) * 100 : null,
      roas: totalGasto      > 0 ? totalIngresos / totalGasto      : null,
      roi:  totalCostoTotal > 0 ? ((totalIngresos - totalCostoTotal) / totalCostoTotal) * 100 : null,
      campanas: campanas
        .map((c) => ({ ...c, roas: c.gasto > 0 ? c.ingresos / c.gasto : null }))
        .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0)),
    };
  }, [resultados, metricas]);

  // ── Diagnóstico vs benchmarks ────────────────────────────────────────────────
  const diagnostico = useMemo(() => {
    // ROAS y ROI: primero los de la BD (m.roas > 0), sino los calculados desde resultados
    const roasVal = valoresAgregados.roas ?? (retornoAtribuido?.roas ?? null);
    const roiVal  = valoresAgregados.roi  ?? (retornoAtribuido?.roi  ?? null);
    const vals: Record<string, number | null> = {
      ctr: valoresAgregados.ctr, cpc: valoresAgregados.cpc, cpm: valoresAgregados.cpm,
      cpl: valoresAgregados.cpl, cpa: valoresAgregados.cpa,
      roas: roasVal, roi: roiVal,
      frecuencia: valoresAgregados.frecuencia,
    };
    return benchmarksActivos.map((b) => {
      const val = vals[b.key] ?? null;
      if (val === null) return { ...b, val: null, valorFmt: null, benchmarkFmt: benchmarkRef(b), desv: null, estado: "sin_datos" as const };
      const n = Number(val);
      const valorFmt = b.unidad === "%" ? `${n.toFixed(2)}%` : b.unidad === "sol" ? FMT_SOL(n) : `${n.toFixed(2)}x`;
      return { ...b, val, valorFmt, benchmarkFmt: benchmarkRef(b), desv: desviacionPct(val, b), estado: estadoBenchmark(val, b) };
    });
  }, [valoresAgregados, benchmarksActivos, retornoAtribuido]);

  return (
    <div className="space-y-6">

      {/* ── Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mejorCpl && (
          <Highlight
            icon={<Award size={15} className="text-green-600" />}
            label="Mejor CPL"
            valor={FMT_SOL(mejorCpl.cpl!)}
            sub={mejorCpl.campana_nombre}
          />
        )}
        {mejorCtr && (
          <Highlight
            icon={<TrendingUp size={15} className="text-blue-600" />}
            label="Mejor CTR"
            valor={FMT_PCT(Number(mejorCtr.ctr))}
            sub={mejorCtr.campana_nombre}
          />
        )}
        {mayorGasto && (
          <Highlight
            icon={<TrendingDown size={15} className="text-amber-600" />}
            label="Mayor inversión"
            valor={FMT_SOL(Number(mayorGasto.gasto))}
            sub={mayorGasto.campana_nombre}
          />
        )}
      </div>

      {/* ── Tendencia CPL ── */}
      {tendenciaCpl.length > 0 && (
        <section className={`${GLASS_BASE} p-5 space-y-3`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-200">Tendencia CPL — campañas con Instant Form</span>
            </div>
            {tendenciaCpl.length >= 2 && (
              <span className={`${BADGE_BASE} text-[11px] font-medium px-2 py-0.5 ${ tendenciaSlope < -5 ? "bg-green-100 text-green-700" : tendenciaSlope > 5 ? "bg-red-100 text-red-700" : "bg-zinc-800 text-zinc-500" }`}>
                {tendenciaSlope < -5 ? "CPL bajando" : tendenciaSlope > 5 ? "CPL subiendo" : "CPL estable"}
                {" "}({tendenciaSlope > 0 ? "+" : ""}{Math.round(tendenciaSlope)} S/ por campaña)
              </span>
            )}
          </div>
          <div style={{ height: 200 }}>
            {chartsMounted && <ResponsiveContainer width="100%" height={192}>
              <LineChart data={tendenciaCpl} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  formatter={(v, name) => [
                    FMT_SOL(Number(v)),
                    (name as string) === "tendencia" ? "Tendencia (regresión)" : "CPL real",
                  ]}
                />
                <ReferenceLine y={cplVerde}    stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1} label={`Obj S/${cplVerde}`} />
                <ReferenceLine y={cplAmarillo} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} label={`Lím S/${cplAmarillo}`} />
                <Line filter="url(#neon-glow)" dataKey="cpl"       stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4, fill: COLORS.primary }} />
                <Line filter="url(#neon-glow)" dataKey="tendencia" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>}
          </div>
        </section>
      )}

      {/* ── Alerta declive CTR ── */}
      {alertaDeclive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <TrendingDown size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-semibold">CTR en declive:</span> bajó <strong>{alertaDeclive.caida}%</strong> entre {alertaDeclive.desde} y {alertaDeclive.hasta}.
            Posible fatiga de audiencia — considera rotar creatividades o ampliar el público objetivo.
          </div>
        </div>
      )}

      {/* ── Análisis comparativo ── */}
      <section className={`${GLASS_BASE} p-5 space-y-4`}>

        {/* Header + toggles de vista */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-200">Análisis comparativo</span>
          </div>
          <div className="flex gap-1 bg-zinc-800 rounded-xl p-1">
            {([
              { v: "campana", label: "Por campaña" },
              { v: "mes",     label: "Por mes"     },
              { v: "anio",    label: "Por año"     },
            ] as { v: Vista; label: string }[]).map(({ v, label }) => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  vista === v ? "bg-slate-800/60 shadow-sm text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de métrica */}
        <div className="flex gap-2 flex-wrap">
          {([
            { k: "gasto",    label: "Gasto",      color: "bg-amber-100 text-amber-700 border-amber-300"   },
            { k: "cpl",      label: "Costo/Lead",  color: "bg-red-100 text-red-700 border-red-300"         },
            { k: "ctr",      label: "CTR",         color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
            { k: "mensajes", label: "Mensajes",    color: "bg-violet-100 text-violet-700 border-violet-300" },
          ] as { k: MetricaVista; label: string; color: string }[]).map(({ k, label, color }) => (
            <button key={k} onClick={() => setMetricaActiva(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                metricaActiva === k ? color + " ring-1 ring-offset-1 ring-current" : "bg-slate-800/60 text-zinc-500 border-white/10 hover:border-white/15"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Cards resumen global con estado de benchmark */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Gasto */}
          <div className={`${PANEL_BASE} border-l-4 border-l-amber-400 px-4 py-3 transition ${metricaActiva === "gasto" ? "shadow-sm" : "opacity-60"}`}>
            <p className="text-[10px] text-zinc-100 uppercase font-medium">Total gasto</p>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{FMT_SOL(resumenTotal.gasto)}</p>
          </div>

          {/* CPL */}
          {(() => {
            const bCpl = benchmarksActivos.find((b) => b.key === "cpl");
            const est  = resumenTotal.cpl !== null && bCpl ? estadoBenchmark(resumenTotal.cpl, bCpl) : null;
            const badge: Record<string, string> = { excelente: "bg-green-100 text-green-700", aceptable: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" };
            const label: Record<string, string> = { excelente: "Excelente", aceptable: "Aceptable", alto: "Alto" };
            return (
              <div className={`${PANEL_BASE} border-l-4 border-l-red-400 px-4 py-3 transition ${metricaActiva === "cpl" ? "shadow-sm" : "opacity-60"}`}>
                <p className="text-[10px] text-zinc-100 uppercase font-medium">CPL promedio</p>
                <p className="text-sm font-bold text-zinc-100 mt-0.5">{resumenTotal.cpl !== null ? FMT_SOL(resumenTotal.cpl) : "Sin leads"}</p>
                {est && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge[est]}`}>{label[est]}</span>}
              </div>
            );
          })()}

          {/* CTR */}
          {(() => {
            const bCtr = benchmarksActivos.find((b) => b.key === "ctr");
            const est  = bCtr ? estadoBenchmark(resumenTotal.ctr, bCtr) : null;
            const badge: Record<string, string> = { excelente: "bg-green-100 text-green-700", aceptable: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" };
            const label: Record<string, string> = { excelente: "Excelente", aceptable: "Aceptable", alto: "Alto" };
            return (
              <div className={`${PANEL_BASE} border-l-4 border-l-emerald-400 px-4 py-3 transition ${metricaActiva === "ctr" ? "shadow-sm" : "opacity-60"}`}>
                <p className="text-[10px] text-zinc-100 uppercase font-medium">CTR promedio</p>
                <p className="text-sm font-bold text-zinc-100 mt-0.5">{`${resumenTotal.ctr.toFixed(2)}%`}</p>
                {est && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge[est]}`}>{label[est]}</span>}
              </div>
            );
          })()}

          {/* Mensajes */}
          <div className={`${PANEL_BASE} border-l-4 border-l-violet-400 px-4 py-3 transition ${metricaActiva === "mensajes" ? "shadow-sm" : "opacity-60"}`}>
            <p className="text-[10px] text-zinc-100 uppercase font-medium">Mensajes</p>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{resumenTotal.mensajes.toLocaleString()}</p>
          </div>
        </div>

        {/* Gráfico de barras */}
        {datosChart.length > 0 && (
          <div style={{ height: 280 }}>
            {chartsMounted && <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosChart} margin={{ top: 5, right: 16, left: 0, bottom: vista === "campana" ? 60 : 5 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  angle={vista === "campana" ? -35 : 0}
                  textAnchor={vista === "campana" ? "end" : "middle"}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    metricaActiva === "gasto" ? `S/${(v / 1000).toFixed(0)}k` :
                    metricaActiva === "cpl"   ? `S/${v}`                       :
                    metricaActiva === "ctr"   ? `${v.toFixed(1)}%`             :
                    String(v)
                  }
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  formatter={(v, _name, props) => {
                    const d = props.payload as typeof datosChart[0];
                    const val = Number(v);
                    const valFmt =
                      metricaActiva === "gasto"    ? FMT_SOL(val)              :
                      metricaActiva === "cpl"      ? FMT_SOL(val)              :
                      metricaActiva === "ctr"      ? `${val.toFixed(2)}%`      :
                      val.toLocaleString("es-PE");
                    const metLabel =
                      metricaActiva === "gasto"    ? "Gasto"        :
                      metricaActiva === "cpl"      ? "Costo / Lead" :
                      metricaActiva === "ctr"      ? "CTR"          : "Mensajes";

                    // Estado vs benchmark
                    let estLabel = "";
                    if (metricaActiva === "cpl" && d?.cpl !== null) {
                      const b = benchmarksActivos.find((x) => x.key === "cpl");
                      if (b) estLabel = estadoBenchmark(val, b) === "excelente" ? " ✓ Excelente" : estadoBenchmark(val, b) === "aceptable" ? " ~ Aceptable" : " ✗ Alto";
                    } else if (metricaActiva === "ctr") {
                      const b = benchmarksActivos.find((x) => x.key === "ctr");
                      if (b) estLabel = estadoBenchmark(val, b) === "excelente" ? " ✓ Excelente" : estadoBenchmark(val, b) === "aceptable" ? " ~ Aceptable" : " ✗ Bajo";
                    }
                    return [`${valFmt}${estLabel}`, metLabel];
                  }}
                />

                {/* Líneas de referencia benchmark — solo para CPL y CTR */}
                {metricaActiva === "cpl" && <>
                  <ReferenceLine y={Number(cplVerde)}    stroke="#16a34a" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: `Exc ≤ S/${Number(cplVerde).toFixed(0)}`,    position: "insideTopRight", fontSize: 9, fill: "#16a34a" }} />
                  <ReferenceLine y={Number(cplAmarillo)} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: `Ace ≤ S/${Number(cplAmarillo).toFixed(0)}`, position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }} />
                </>}
                {metricaActiva === "ctr" && <>
                  <ReferenceLine y={ctrExcelente} stroke="#16a34a" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: `Exc ≥ ${ctrExcelente}%`, position: "insideTopRight", fontSize: 9, fill: "#16a34a" }} />
                  <ReferenceLine y={ctrAceptable} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: `Ace ≥ ${ctrAceptable}%`, position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }} />
                </>}

                <Bar filter="url(#neon-glow)" dataKey={metricaActiva} radius={[4, 4, 0, 0]}>
                  {datosChart.map((d, i) => {
                    const fill: string =
                      metricaActiva === "cpl" && d.cpl !== null ? cplBgColor(d.cpl)
                      : metricaActiva === "ctr" ? (d.ctr >= ctrExcelente ? "#16a34a" : d.ctr >= ctrAceptable ? "#f59e0b" : "#ef4444")
                      : metricaActiva === "mensajes" ? "#8b5cf6"
                      : "#ceab11";
                    return <Cell key={i} fill={fill as any} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
          </div>
        )}

        {datosChart.length === 0 && (
          <div className={`${PANEL_BASE} p-8 text-center text-xs text-zinc-400`}>
            Sin datos para graficar con la métrica seleccionada
          </div>
        )}
      </section>

      {/* ── Diagnóstico por Métrica ── */}
      <section className={`${GLASS_BASE} p-5 space-y-3`}>
        <div className="flex items-center gap-2 flex-wrap">
          <Target size={15} className="text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-200">Diagnóstico por métrica</span>
          {sectorActivo ? (
            <span className={`${BADGE_BASE} text-[10px] text-violet-700 px-2 py-0.5 font-medium`}>
              {sectorLabel(sectorActivo)} · benchmarks dinámicos
            </span>
          ) : (
            <span className={`${BADGE_BASE} text-[10px] text-zinc-500 px-2 py-0.5`}>
              Inmobiliario (default) · configura en Benchmarks
            </span>
          )}
        </div>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/40 text-zinc-100 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Métrica</th>
                <th className="px-4 py-2.5 text-right font-medium">Tu promedio</th>
                <th className="px-4 py-2.5 text-right font-medium">Benchmark excelente</th>
                <th className="px-4 py-2.5 text-right font-medium">Desviación</th>
                <th className="px-4 py-2.5 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {diagnostico.map((d) => {
                const desvColor = d.desv
                  ? (d.mayor_es_mejor
                      ? (d.desv.pct >= 0 ? "text-green-600" : "text-red-500")
                      : (d.desv.pct >= 0 ? "text-red-500" : "text-green-600"))
                  : "";
                return (
                  <tr key={d.key} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-semibold text-zinc-200">{d.label}</p>
                      <p className="text-zinc-400 text-[10px] leading-tight">{d.descripcion}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d.valorFmt ? (
                        <span className={`font-bold text-sm ${
                          d.estado === "excelente" ? "text-green-600"
                          : d.estado === "aceptable" ? "text-amber-500"
                          : "text-red-500"
                        }`}>
                          {d.valorFmt}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-[11px]">Sin datos</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-[11px] tabular-nums">
                      {d.benchmarkFmt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.desv ? (
                        <div>
                          <p className={`font-bold tabular-nums ${desvColor}`}>{d.desv.texto}</p>
                          <p className="text-[9px] text-zinc-400">
                            {d.desv.pct > 0
                              ? (d.mayor_es_mejor ? "sobre el objetivo" : "sobre el umbral")
                              : (d.mayor_es_mejor ? "bajo el objetivo"  : "bajo el umbral")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstadoBadge estado={d.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={`${PANEL_BASE} p-4 space-y-2`}>
          <p className="text-[10px] text-zinc-500">
            Benchmarks ajustados -20% para Latinoamérica Tier 3 (Perú). Tipo de cambio S/ 3.80/USD.
            CPL calculado solo para campañas con Instant Form (leads &gt; 0).
          </p>
          <p className="text-[10px] font-medium text-zinc-500">Fuentes:</p>
          {FUENTES_URLS.map((f) => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
              className="block text-[10px] text-blue-500 hover:underline truncate">
              · {f.label}
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}

function fmtRef(v: unknown): string {
  if (typeof v !== "number") return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function benchmarkRef(b: BenchmarkDef): string {
  if (b.key === "frecuencia") return "Óptimo 1.5 – 2.5x";
  if (b.mayor_es_mejor) {
    const ref = b.excelente.min ?? b.aceptable.min;
    if (typeof ref !== "number") return "—";
    if (b.unidad === "%")   return `≥ ${fmtRef(ref)}%`;
    if (b.unidad === "sol") return `≥ S/ ${fmtRef(ref)}`;
    return `≥ ${fmtRef(ref)}x`;
  } else {
    const ref = b.excelente.max ?? b.aceptable.max;
    if (typeof ref !== "number") return "—";
    if (b.unidad === "%")   return `< ${fmtRef(ref)}%`;
    if (b.unidad === "sol") return `< S/ ${fmtRef(ref)}`;
    return `< ${fmtRef(ref)}x`;
  }
}

function EstadoBadge({ estado }: { estado: "excelente" | "aceptable" | "alto" | "sin_datos" }) {
  if (estado === "sin_datos") return <span className="text-zinc-300 text-[10px]">Sin datos</span>;
  const map = {
    excelente: { bg: "bg-green-100 text-green-700",  label: "Excelente" },
    aceptable: { bg: "bg-amber-100 text-amber-700",  label: "Aceptable" },
    alto:      { bg: "bg-red-100 text-red-700",      label: "Alto" },
  };
  const { bg, label } = map[estado];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${bg}`}>{label}</span>;
}

function Highlight({ icon, label, valor, sub }: {
  icon: React.ReactNode; label: string; valor: string; sub: string;
}) {
  return (
    <div className={`${PANEL_BASE} px-4 py-3 space-y-1`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        {icon}{label}
      </div>
      <p className="text-lg font-black text-zinc-100">{valor}</p>
      <p className="text-[11px] text-zinc-500 truncate">{sub}</p>
    </div>
  );
}
