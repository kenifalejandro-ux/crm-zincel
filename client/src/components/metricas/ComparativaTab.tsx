/** client/src/components/metricas/ComparativaTab.tsx */

import { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Award, BarChart2, Calendar, Target } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { Metrica } from "../../types/metricas.types";
import type { BenchmarkSector } from "../../types/benchmark.types";
import { getBenchmarkPorEmpresa } from "../../services/benchmarks.api";
import { sectorLabel } from "../../utils/sectores";
import { COLORS } from "../../lib/tokens";

interface Props { metricas: Metrica[]; empresa?: string }

type OrdenRanking = "cpl" | "ctr" | "gasto" | "clics" | "cpc";
type Agrupacion   = "mes" | "anio";

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
    const exc = (din as any)[`${b.key}_excelente`] as number | null | undefined;
    const ace = (din as any)[`${b.key}_aceptable`] as number | null | undefined;
    if ((exc === null || exc === undefined) && (ace === null || ace === undefined)) return b;
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
  const [orden,         setOrden]         = useState<OrdenRanking>("cpl");
  const [agrupacion,    setAgrupacion]    = useState<Agrupacion>("mes");
  const [benchmarkDin,  setBenchmarkDin]  = useState<BenchmarkSector | null>(null);
  const [sectorActivo,   setSectorActivo]  = useState<string | null>(null);

  useEffect(() => {
    if (!empresa) { setBenchmarkDin(null); setSectorActivo(null); return; }
    getBenchmarkPorEmpresa(empresa)
      .then((b) => { setBenchmarkDin(b); setSectorActivo(b?.sector ?? null); })
      .catch(() => { setBenchmarkDin(null); setSectorActivo(null); });
  }, [empresa]);

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
  const cplColor = (cpl: number) =>
    cpl <= cplVerde ? "text-green-600" : cpl <= cplAmarillo ? "text-amber-500" : "text-red-500";

  // ── Ranking ──────────────────────────────────────────────────────────────────
  const ranking = useMemo(() => {
    return [...metricas]
      .map((m) => ({
        ...m,
        cpl: Number(m.leads) > 0 ? Number(m.gasto) / Number(m.leads) : null,
      }))
      .sort((a, b) => {
        if (orden === "cpl") {
          if (a.cpl === null) return 1;
          if (b.cpl === null) return -1;
          return a.cpl - b.cpl;
        }
        if (orden === "ctr")   return Number(b.ctr)   - Number(a.ctr);
        if (orden === "gasto") return Number(b.gasto) - Number(a.gasto);
        if (orden === "clics") return Number(b.clics) - Number(a.clics);
        if (orden === "cpc")   return Number(a.cpc)   - Number(b.cpc);
        return 0;
      });
  }, [metricas, orden]);

  // ── Tendencia CPL + regresión lineal ─────────────────────────────────────────
  const { tendenciaCpl, tendenciaSlope } = useMemo(() => {
    const puntos = metricas
      .filter((m) => Number(m.leads) > 0)
      .map((m) => ({
        nombre: m.campana_nombre.length > 20 ? m.campana_nombre.slice(0, 20) + "…" : m.campana_nombre,
        cpl:    Math.round(Number(m.gasto) / Number(m.leads)),
        fecha:  m.periodo_inicio,
      }))
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

  // ── Comparativa por período ───────────────────────────────────────────────────
  const porPeriodo = useMemo(() => {
    const mapa = new Map<string, { gasto: number; leads: number; clics: number; impresiones: number; campanas: number }>();
    for (const m of metricas) {
      const fecha = new Date(m.periodo_inicio);
      const key   = agrupacion === "mes"
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
        : `${fecha.getFullYear()}`;
      const prev = mapa.get(key) ?? { gasto: 0, leads: 0, clics: 0, impresiones: 0, campanas: 0 };
      mapa.set(key, {
        gasto:       prev.gasto       + Number(m.gasto),
        leads:       prev.leads       + Number(m.leads),
        clics:       prev.clics       + Number(m.clics),
        impresiones: prev.impresiones + Number(m.impresiones),
        campanas:    prev.campanas    + 1,
      });
    }
    return Array.from(mapa.entries())
      .map(([periodo, d]) => ({
        periodo, ...d,
        cpl: d.leads > 0 ? Math.round(d.gasto / d.leads) : 0,
        ctr: d.impresiones > 0 ? Number((d.clics / d.impresiones * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [metricas, agrupacion]);

  // ── Estacionalidad: mejor y peor período por CPL ──────────────────────────────
  const { mejorPeriodo, peorPeriodo } = useMemo(() => {
    const conCpl = porPeriodo.filter((p) => p.cpl > 0);
    if (!conCpl.length) return { mejorPeriodo: null, peorPeriodo: null };
    const mejor = conCpl.reduce((a, b) => a.cpl < b.cpl ? a : b);
    const peor  = conCpl.reduce((a, b) => a.cpl > b.cpl ? a : b);
    return { mejorPeriodo: mejor.periodo, peorPeriodo: peor.periodo };
  }, [porPeriodo]);

  // ── Alerta de declive CTR: últimos 2 períodos consecutivos bajando ────────────
  const alertaDeclive = useMemo(() => {
    const conCtr = porPeriodo.filter((p) => p.ctr > 0);
    if (conCtr.length < 2) return null;
    const ult = conCtr.slice(-2);
    if (ult[1].ctr < ult[0].ctr) {
      const caida = (((ult[0].ctr - ult[1].ctr) / ult[0].ctr) * 100).toFixed(1);
      return { desde: ult[0].periodo, hasta: ult[1].periodo, caida };
    }
    return null;
  }, [porPeriodo]);

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

  // ── Diagnóstico vs benchmarks ────────────────────────────────────────────────
  const diagnostico = useMemo(() => {
    const vals: Record<string, number | null> = {
      ctr: valoresAgregados.ctr, cpc: valoresAgregados.cpc, cpm: valoresAgregados.cpm,
      cpl: valoresAgregados.cpl, cpa: valoresAgregados.cpa, roas: valoresAgregados.roas,
      roi: valoresAgregados.roi, frecuencia: valoresAgregados.frecuencia,
    };
    return benchmarksActivos.map((b) => {
      const val = vals[b.key] ?? null;
      if (val === null) return { ...b, val: null, valorFmt: null, benchmarkFmt: benchmarkRef(b), desv: null, estado: "sin_datos" as const };
      const valorFmt = b.unidad === "%" ? `${val.toFixed(2)}%` : b.unidad === "sol" ? FMT_SOL(val) : `${val.toFixed(2)}x`;
      return { ...b, val, valorFmt, benchmarkFmt: benchmarkRef(b), desv: desviacionPct(val, b), estado: estadoBenchmark(val, b) };
    });
  }, [valoresAgregados, benchmarksActivos]);

  return (
    <div className="space-y-8">

      {/* ── Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mejorCpl && (
          <Highlight
            icon={<Award size={15} className="text-green-600" />}
            bg="bg-green-50 border-green-200"
            label="Mejor CPL"
            valor={FMT_SOL(mejorCpl.cpl!)}
            sub={mejorCpl.campana_nombre}
          />
        )}
        {mejorCtr && (
          <Highlight
            icon={<TrendingUp size={15} className="text-blue-600" />}
            bg="bg-blue-50 border-blue-200"
            label="Mejor CTR"
            valor={FMT_PCT(Number(mejorCtr.ctr))}
            sub={mejorCtr.campana_nombre}
          />
        )}
        {mayorGasto && (
          <Highlight
            icon={<TrendingDown size={15} className="text-amber-600" />}
            bg="bg-amber-50 border-amber-200"
            label="Mayor inversión"
            valor={FMT_SOL(Number(mayorGasto.gasto))}
            sub={mayorGasto.campana_nombre}
          />
        )}
      </div>

      {/* ── Ranking ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-800">Ranking de campañas</span>
          </div>
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
            {(["cpl", "ctr", "gasto", "clics", "cpc"] as OrdenRanking[]).map((o) => (
              <button
                key={o}
                onClick={() => setOrden(o)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  orden === o ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {o.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium w-6">#</th>
                <th className="px-4 py-2.5 text-left font-medium">Campaña</th>
                <th className="px-4 py-2.5 text-right font-medium">Gasto</th>
                <th className="px-4 py-2.5 text-right font-medium">Leads</th>
                <th className="px-4 py-2.5 text-right font-medium">Clics</th>
                <th className="px-4 py-2.5 text-right font-medium">CTR</th>
                <th className="px-4 py-2.5 text-right font-medium">CPC</th>
                <th className="px-4 py-2.5 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {ranking.map((m, i) => (
                <tr key={m.id} className={`hover:bg-zinc-50 transition ${i === 0 ? "bg-green-50/40" : ""}`}>
                  <td className="px-4 py-2.5 text-zinc-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5 text-zinc-700 font-medium max-w-[200px] truncate">
                    {i === 0 && <span className="mr-1">🏆</span>}
                    {m.campana_nombre}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-600">{FMT_SOL(Number(m.gasto))}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-zinc-800">{Number(m.leads)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-600">{Number(m.clics).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={Number(m.ctr) >= 3 ? "text-green-600 font-semibold" : Number(m.ctr) >= 1.5 ? "text-amber-500" : "text-red-500"}>
                      {FMT_PCT(Number(m.ctr))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-600">{FMT_SOL(Number(m.cpc))}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {m.cpl !== null
                      ? <span className={cplColor(m.cpl!)}>{FMT_SOL(m.cpl)}</span>
                      : <span className="text-zinc-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tendencia CPL ── */}
      {tendenciaCpl.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-800">Tendencia CPL — campañas con Instant Form</span>
            </div>
            {tendenciaCpl.length >= 2 && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                tendenciaSlope < -5  ? "bg-green-100 text-green-700" :
                tendenciaSlope > 5   ? "bg-red-100 text-red-700"    :
                                       "bg-zinc-100 text-zinc-500"
              }`}>
                {tendenciaSlope < -5 ? "CPL bajando" : tendenciaSlope > 5 ? "CPL subiendo" : "CPL estable"}
                {" "}({tendenciaSlope > 0 ? "+" : ""}{Math.round(tendenciaSlope)} S/ por campaña)
              </span>
            )}
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
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
                <ReferenceLine y={cplVerde}    stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1} label={{ value: `Obj S/${cplVerde}`,    position: "right", fontSize: 9, fill: "#16a34a" }} />
                <ReferenceLine y={cplAmarillo} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} label={{ value: `Lím S/${cplAmarillo}`, position: "right", fontSize: 9, fill: "#f59e0b" }} />
                <Line dataKey="cpl"       stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4, fill: COLORS.primary }} />
                <Line dataKey="tendencia" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
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

      {/* ── Comparativa por período ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-800">Inversión por período</span>
          </div>
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
            {(["mes", "anio"] as Agrupacion[]).map((a) => (
              <button
                key={a}
                onClick={() => setAgrupacion(a)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  agrupacion === a ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {a === "mes" ? "Por mes" : "Por año"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porPeriodo} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                formatter={(v, name) => [
                  (name as string) === "gasto" ? FMT_SOL(Number(v)) : Number(v).toLocaleString(),
                  (name as string) === "gasto" ? "Gasto" : (name as string) === "leads" ? "Leads" : "Clics",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="gasto" name="Gasto"  fill={COLORS.primary}     radius={[4,4,0,0]} />
              <Bar dataKey="clics" name="Clics"  fill={COLORS.muted}       radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla resumen por período */}
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Período</th>
                <th className="px-4 py-2.5 text-right font-medium">Campañas</th>
                <th className="px-4 py-2.5 text-right font-medium">Gasto</th>
                <th className="px-4 py-2.5 text-right font-medium">Leads</th>
                <th className="px-4 py-2.5 text-right font-medium">CTR</th>
                <th className="px-4 py-2.5 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {porPeriodo.map((p) => {
                const esMejor = mejorPeriodo === p.periodo && p.cpl > 0;
                const esPeor  = peorPeriodo  === p.periodo && p.cpl > 0 && mejorPeriodo !== peorPeriodo;
                return (
                  <tr key={p.periodo} className={`transition ${esMejor ? "bg-green-50/60" : esPeor ? "bg-red-50/40" : "hover:bg-zinc-50"}`}>
                    <td className="px-4 py-2.5 font-medium text-zinc-800 flex items-center gap-1.5">
                      {esMejor && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Mejor</span>}
                      {esPeor  && <span className="text-[10px] bg-red-100   text-red-600   px-1.5 py-0.5 rounded-full font-semibold">Peor</span>}
                      {p.periodo}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">{p.campanas}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-700">{FMT_SOL(p.gasto)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-zinc-800">{p.leads}</td>
                    <td className="px-4 py-2.5 text-right">
                      {p.ctr > 0
                        ? <span className={p.ctr >= 3.5 ? "text-green-600 font-semibold" : p.ctr >= 2.2 ? "text-amber-500" : "text-red-500"}>
                            {FMT_PCT(p.ctr)}
                          </span>
                        : <span className="text-zinc-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {p.cpl > 0
                        ? <span className={cplColor(p.cpl)}>{FMT_SOL(p.cpl)}</span>
                        : <span className="text-zinc-300">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Diagnóstico por Métrica ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Target size={15} className="text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-800">Diagnóstico por métrica</span>
          {sectorActivo ? (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {sectorLabel(sectorActivo)} · benchmarks dinámicos
            </span>
          ) : (
            <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
              Inmobiliario (default) · configura en Benchmarks
            </span>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Métrica</th>
                <th className="px-4 py-2.5 text-right font-medium">Tu promedio</th>
                <th className="px-4 py-2.5 text-right font-medium">Benchmark excelente</th>
                <th className="px-4 py-2.5 text-right font-medium">Desviación</th>
                <th className="px-4 py-2.5 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {diagnostico.map((d) => {
                const desvColor = d.desv
                  ? (d.mayor_es_mejor
                      ? (d.desv.pct >= 0 ? "text-green-600" : "text-red-500")
                      : (d.desv.pct >= 0 ? "text-red-500" : "text-green-600"))
                  : "";
                return (
                  <tr key={d.key} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-semibold text-zinc-800">{d.label}</p>
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

        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-2">
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
      </div>

    </div>
  );
}

function benchmarkRef(b: BenchmarkDef): string {
  if (b.key === "frecuencia") return "Óptimo 1.5 – 2.5x";
  if (b.mayor_es_mejor) {
    const ref = b.excelente.min ?? b.aceptable.min;
    if (ref === null) return "—";
    if (b.unidad === "%")   return `≥ ${ref}%`;
    if (b.unidad === "sol") return `≥ S/ ${ref.toFixed(2)}`;
    return `≥ ${ref}x`;
  } else {
    const ref = b.excelente.max ?? b.aceptable.max;
    if (ref === null) return "—";
    if (b.unidad === "%")   return `< ${ref}%`;
    if (b.unidad === "sol") return `< S/ ${ref.toFixed(0)}`;
    return `< ${ref}x`;
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

function Highlight({ icon, bg, label, valor, sub }: {
  icon: React.ReactNode; bg: string; label: string; valor: string; sub: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 space-y-1 ${bg}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        {icon}{label}
      </div>
      <p className="text-lg font-black text-zinc-900">{valor}</p>
      <p className="text-[11px] text-zinc-500 truncate">{sub}</p>
    </div>
  );
}
