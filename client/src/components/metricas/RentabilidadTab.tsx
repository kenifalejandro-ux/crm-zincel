/** client/src/components/metricas/RentabilidadTab.tsx */

import { useState, useMemo, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Metrica } from "../../types/metricas.types";
import type { BenchmarkSector } from "../../types/benchmark.types";
import type { Resultado } from "../../types/resultado.types";
import { getBenchmarkPorEmpresa } from "../../services/benchmarks.api";
import { listarResultados } from "../../services/resultados.api";
import { sectorLabel } from "../../utils/sectores";

type RentabilidadView = "roas" | "roi";
interface Props { metricas: Metrica[]; empresa?: string; view?: RentabilidadView }

type VistaRentabilidad = "campana" | "portfolio";

const FMT_SOL = (v: number) =>
  `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Badges simples de ROAS y ROI (sin depender del sistema completo de benchmarks)
const BADGE_STYLE: Record<string, string> = {
  excelente: "bg-green-100 text-green-700",
  aceptable: "bg-amber-100 text-amber-700",
  alto:      "bg-red-100 text-red-700",
};
const BADGE_LABEL: Record<string, string> = {
  excelente: "Excelente", aceptable: "Aceptable", alto: "Bajo",
};
const roasEstado = (v: number) => v >= 5 ? "excelente" : v >= 2 ? "aceptable" : "alto";
const roiEstado  = (v: number) => v >= 200 ? "excelente" : v >= 100 ? "aceptable" : "alto";

// ── Benchmarks de rentabilidad de ventas por sector ──────────────────────────
// Fuentes: NAR 2024, Meta Industry Insights 2025, HubSpot Real Estate 2025,
//          Properati LatAm 2024, ASEI Perú, ENR 2024, AGC 2025
interface BenchmarkVentaSector {
  label:     string;
  pctCosto:  { excelente: number; aceptable: number };
  roasVenta: { excelente: number; aceptable: number };
  ejemploS:  number;
  fuentes:   { label: string; url: string }[];
}

const BENCHMARKS_VENTA_SECTOR: Record<string, BenchmarkVentaSector> = {
  inmobiliaria: {
    label: "Inmobiliaria residencial",
    pctCosto:  { excelente: 2,  aceptable: 5  },
    roasVenta: { excelente: 20, aceptable: 8  },
    ejemploS:  120_000,
    fuentes: [
      { label: "NAR Profile of Home Buyers and Sellers 2024",        url: "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-profile-of-home-buyers-and-sellers" },
      { label: "Meta Real Estate Industry Insights 2025",             url: "https://www.facebook.com/business/industries/real-estate" },
      { label: "HubSpot State of Marketing 2025 — Real Estate",      url: "https://www.hubspot.com/state-of-marketing" },
      { label: "Properati LatAm Real Estate Marketing Study 2024",   url: "https://properati.com" },
      { label: "ASEI Asociación de Empresas Inmobiliarias del Perú", url: "https://asei.com.pe" },
    ],
  },
  construccion: {
    label: "Construcción e ingeniería",
    pctCosto:  { excelente: 3, aceptable: 8  },
    roasVenta: { excelente: 12, aceptable: 5 },
    ejemploS:  500_000,
    fuentes: [
      { label: "ENR Top 500 Contractors Marketing Report 2024",   url: "https://www.enr.com/toplists" },
      { label: "AGC Construction Industry Marketing Benchmarks",  url: "https://www.agc.org" },
      { label: "HubSpot Construction Marketing Report 2025",      url: "https://www.hubspot.com/state-of-marketing" },
    ],
  },
  tecnologia: {
    label: "Tecnología / SaaS",
    pctCosto:  { excelente: 8, aceptable: 20 },
    roasVenta: { excelente: 8, aceptable: 3  },
    ejemploS:  50_000,
    fuentes: [
      { label: "OpenView SaaS Benchmarks 2024",      url: "https://openviewpartners.com/saas-benchmarks" },
      { label: "SaaS Capital Metrics Report 2025",   url: "https://www.saas-capital.com" },
    ],
  },
  retail: {
    label: "Retail / Comercio",
    pctCosto:  { excelente: 5, aceptable: 12 },
    roasVenta: { excelente: 10, aceptable: 4 },
    ejemploS:  5_000,
    fuentes: [
      { label: "NRF Retail Marketing Benchmarks 2024",   url: "https://nrf.com" },
      { label: "Shopify Commerce Trends Report 2025",    url: "https://www.shopify.com/research" },
    ],
  },
  educacion: {
    label: "Educación / Capacitación",
    pctCosto:  { excelente: 10, aceptable: 25 },
    roasVenta: { excelente: 6, aceptable: 3   },
    ejemploS:  8_000,
    fuentes: [
      { label: "HubSpot Education Marketing Report 2025",          url: "https://www.hubspot.com/state-of-marketing" },
      { label: "WordStream Education Ads Benchmarks 2025",         url: "https://www.wordstream.com/blog/facebook-ads-benchmarks-2025" },
    ],
  },
};

const BENCHMARK_VENTA_DEFAULT: BenchmarkVentaSector = {
  label:     "Industria general",
  pctCosto:  { excelente: 5, aceptable: 12 },
  roasVenta: { excelente: 8, aceptable: 3  },
  ejemploS:  50_000,
  fuentes: [
    { label: "HubSpot State of Marketing 2025", url: "https://www.hubspot.com/state-of-marketing" },
    { label: "Gartner CMO Spend Survey 2024",   url: "https://www.gartner.com/en/marketing" },
  ],
};

// ── Componente ───────────────────────────────────────────────────────────────
export function RentabilidadTab(props: Props) {
  const { metricas, empresa, view } = props;
  const modo = view === "roi" ? "roi" : "roas";
  const [benchmarkDin,     setBenchmarkDin]     = useState<BenchmarkSector | null>(null);
  const [sectorActivo,     setSectorActivo]     = useState<string | null>(null);
  const [resultados,       setResultados]       = useState<Resultado[]>([]);
  const [vistaRentabilidad, setVistaRentabilidad] = useState<VistaRentabilidad>("campana");

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

  useEffect(() => {
    if (!empresaEfectiva) { setResultados([]); return; }
    listarResultados({ empresa: empresaEfectiva })
      .then(setResultados)
      .catch(() => setResultados([]));
  }, [empresaEfectiva]);

  const totalGastoTodasCampanas = useMemo(
    () => metricas.reduce((a, m) => a + Number(m.gasto), 0),
    [metricas]
  );

  const retornoAtribuido = useMemo(() => {
    if (!resultados.length) return null;

    const porCampana = new Map<string, {
      nombre: string; ventas: number; ingresos: number; honorarios: number; gasto: number;
    }>();

    for (const r of resultados) {
      const ids = (r.metrica_ids && r.metrica_ids.length > 0)
        ? r.metrica_ids
        : r.metrica_id
          ? [r.metrica_id]
          : [];
      const repartoIngresos  = ids.length > 0 ? Number(r.monto) / ids.length : 0;
      const repartoHonorarios = ids.length > 0 ? Number(r.costo_venta ?? 0) / ids.length : 0;

      for (const id of ids) {
        const metrica = metricas.find((m) => m.id === id);
        const gasto   = metrica ? Number(metrica.gasto) : 0;
        const prev    = porCampana.get(id) ?? {
          nombre: metrica?.campana_nombre ?? r.campana_nombre,
          ventas: 0,
          ingresos: 0,
          honorarios: 0,
          gasto,
        };
        porCampana.set(id, {
          nombre:     prev.nombre,
          ventas:     prev.ventas + 1,
          ingresos:   prev.ingresos + repartoIngresos,
          honorarios: prev.honorarios + repartoHonorarios,
          gasto:      prev.gasto,
        });
      }
    }

    const campanas          = Array.from(porCampana.values());
    const totalVentas       = campanas.reduce((a, c) => a + c.ventas,    0);
    const totalIngresos     = campanas.reduce((a, c) => a + c.ingresos,  0);
    const totalHonorarios   = campanas.reduce((a, c) => a + c.honorarios, 0);
    const totalGastoCampanas= campanas.reduce((a, c) => a + c.gasto,     0);
    const totalCostoTotal   = totalGastoCampanas + totalHonorarios;

    return {
      totalVentas,
      totalIngresos,
      totalGasto:     totalGastoCampanas,
      totalHonorarios,
      totalCostoTotal,
      costoPorVenta:       totalVentas > 0     ? totalCostoTotal / totalVentas           : null,
      pctCostoComercial:   totalIngresos > 0   ? (totalCostoTotal / totalIngresos) * 100  : null,
      roas:  totalGastoCampanas > 0 ? totalIngresos / totalGastoCampanas : null,
      roi:   totalCostoTotal    > 0 ? ((totalIngresos - totalCostoTotal) / totalCostoTotal) * 100 : null,
      campanas: campanas
        .map((c) => ({
          ...c,
          roas: c.gasto > 0 ? c.ingresos / c.gasto : null,
          roi:  c.gasto > 0 ? ((c.ingresos - c.gasto) / c.gasto) * 100 : null,
        }))
        .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0)),
    };
  }, [resultados, metricas]);

  // Benchmark de ventas activo según sector
  const bv: BenchmarkVentaSector = (sectorActivo && BENCHMARKS_VENTA_SECTOR[sectorActivo])
    ? BENCHMARKS_VENTA_SECTOR[sectorActivo]
    : BENCHMARK_VENTA_DEFAULT;

  // Valores de rentabilidad según vista (campana vs portfolio)
  const { gastoBase, costoTotal, pct, multi } = useMemo(() => {
    if (!retornoAtribuido) return { gastoBase: 0, costoTotal: 0, pct: 0, multi: null };
    const gastoBase  = vistaRentabilidad === "portfolio"
      ? totalGastoTodasCampanas
      : retornoAtribuido.totalGasto;
    const costoTotal = gastoBase + retornoAtribuido.totalHonorarios;
    const pct        = retornoAtribuido.totalIngresos > 0
      ? (costoTotal / retornoAtribuido.totalIngresos) * 100 : 0;
    const multi      = costoTotal > 0
      ? retornoAtribuido.totalIngresos / costoTotal : null;
    return { gastoBase, costoTotal, pct, multi };
  }, [retornoAtribuido, vistaRentabilidad, totalGastoTodasCampanas]);

  // Estados vs benchmarks
  const estadoPct: "excelente" | "aceptable" | "alto" =
    pct <= bv.pctCosto.excelente ? "excelente" :
    pct <= bv.pctCosto.aceptable ? "aceptable" : "alto";

  const estadoRoasVenta: "excelente" | "aceptable" | "alto" | null = multi !== null
    ? (multi >= bv.roasVenta.excelente ? "excelente" :
       multi >= bv.roasVenta.aceptable ? "aceptable" : "alto")
    : null;

  const veredictoGlobal: "excelente" | "aceptable" | "alto" =
    (estadoPct === "excelente" && estadoRoasVenta !== "alto") ? "excelente" :
    (estadoPct === "alto"      || estadoRoasVenta === "alto") ? "alto" : "aceptable";

  const VBADGE: Record<string, string> = {
    excelente: "bg-green-100 text-green-700 border-green-300",
    aceptable: "bg-amber-100 text-amber-700 border-amber-300",
    alto:      "bg-red-100 text-red-700 border-red-300",
  };
  const VLABEL: Record<string, string> = {
    excelente: "Excelente", aceptable: "Rentable", alto: "Por mejorar",
  };
  const colorMulti = multi !== null
    ? (estadoRoasVenta === "excelente" ? "text-green-700"
    : estadoRoasVenta === "aceptable"  ? "text-amber-600" : "text-red-500")
    : "text-zinc-400";

  const ejInvExc = bv.ejemploS * bv.pctCosto.excelente / 100;
  const ejInvAce = bv.ejemploS * bv.pctCosto.aceptable / 100;

  const narrativaCierre =
    veredictoGlobal === "excelente" ? "Inversión muy eficiente — puede sostener un esquema de comisiones." :
    veredictoGlobal === "aceptable" ? "Dentro del rango rentable. Aumentar volumen mejora el ratio." :
    "Por encima del benchmark. A mayor volumen de ventas el % baja y el análisis mejora.";

  if (!empresaEfectiva) {
    return (
      <div className="flex items-start gap-3 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl px-5 py-6 text-xs text-zinc-500">
        <DollarSign size={16} className="mt-0.5 text-zinc-400 shrink-0" />
        <p>Selecciona una empresa en los filtros para ver el análisis de {modo === "roi" ? "ROI" : "ROAS"} atribuido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Ventas atribuidas a campañas ── */}
      {retornoAtribuido ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <div>
              <p className="text-sm font-semibold text-zinc-800">{modo === "roi" ? "ROI atribuido" : "ROAS atribuido"}</p>
              <p className="text-xs text-zinc-500">{modo === "roi"
                ? "Evaluación del retorno neto sobre ventas atribuibles."
                : "Evaluación del retorno por cada sol invertido en campañas con ventas atribuidas."}</p>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {retornoAtribuido.totalVentas} {retornoAtribuido.totalVentas === 1 ? "venta" : "ventas"} registradas
            </span>
            {sectorActivo && (
              <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                {sectorLabel(sectorActivo)}
              </span>
            )}
          </div>

          {/* KPIs retorno */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 border-l-4 border-l-green-400 rounded-xl px-4 py-3">
              <p className="text-[10px] text-zinc-500 uppercase font-medium">Ingresos atribuidos</p>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">{FMT_SOL(retornoAtribuido.totalIngresos)}</p>
            </div>
            <div className="bg-white border border-zinc-200 border-l-4 border-l-amber-400 rounded-xl px-4 py-3">
              <p className="text-[10px] text-zinc-500 uppercase font-medium">Gasto en campañas</p>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">{FMT_SOL(retornoAtribuido.totalGasto)}</p>
            </div>
            {modo === "roas" ? (
              <div className="bg-white border border-zinc-200 border-l-4 border-l-blue-400 rounded-xl px-4 py-3">
                <p className="text-[10px] text-zinc-500 uppercase font-medium">ROAS efectivo</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">
                  {retornoAtribuido.roas !== null ? `${retornoAtribuido.roas.toFixed(1)}x` : "—"}
                </p>
                {retornoAtribuido.roas !== null && (() => {
                  const est = roasEstado(retornoAtribuido.roas!);
                  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_STYLE[est]}`}>{BADGE_LABEL[est]}</span>;
                })()}
              </div>
            ) : null}
            {modo === "roi" ? (
              <div className="bg-white border border-zinc-200 border-l-4 border-l-violet-400 rounded-xl px-4 py-3">
                <p className="text-[10px] text-zinc-500 uppercase font-medium">ROI neto</p>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">
                  {retornoAtribuido.roi !== null ? `${retornoAtribuido.roi.toFixed(0)}%` : "—"}
                </p>
                {retornoAtribuido.roi !== null && (() => {
                  const est = roiEstado(retornoAtribuido.roi!);
                  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_STYLE[est]}`}>{BADGE_LABEL[est]}</span>;
                })()}
              </div>
            ) : null}
          </div>

          {/* Detalle por campaña */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Campaña</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ventas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                  <th className="px-4 py-2.5 text-right font-medium">Gasto pauta</th>
                  <th className="px-4 py-2.5 text-right font-medium">{modo === "roi" ? "ROI" : "ROAS"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {retornoAtribuido.campanas.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-2.5 font-medium text-zinc-800 max-w-[200px] truncate">{c.nombre}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">{c.ventas}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-700">{FMT_SOL(c.ingresos)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">{FMT_SOL(c.gasto)}</td>
                    <td className="px-4 py-2.5 text-right font-bold">
                      {modo === "roi" ? (
                        c.roi !== null ? (
                          <span className={c.roi >= 100 ? "text-green-600" : c.roi >= 0 ? "text-amber-500" : "text-red-500"}>
                            {c.roi.toFixed(0)}%
                          </span>
                        ) : "—"
                      ) : (
                        c.roas !== null ? (
                          <span className={c.roas >= 5 ? "text-green-600" : c.roas >= 2 ? "text-amber-500" : "text-red-500"}>
                            {c.roas.toFixed(1)}x
                          </span>
                        ) : "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl px-5 py-4 text-xs text-zinc-500">
          <span className="text-lg mt-0.5">💡</span>
          <div className="space-y-0.5">
            <p className="font-semibold text-zinc-700">Sin ventas registradas — el análisis de rentabilidad estará disponible cuando registres ventas</p>
            <p>Vincula cada venta cerrada a su campaña en <strong>Resultados de campaña</strong> y el ROAS, ROI y rentabilidad se calcularán automáticamente.</p>
          </div>
        </div>
      )}

      {/* ── Rentabilidad comercial ── */}
      {retornoAtribuido && retornoAtribuido.totalVentas > 0 && (
        <div className="space-y-4">
          {/* Header + toggle */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">📊</span>
              <span className="text-sm font-semibold text-zinc-800">Rentabilidad comercial</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${VBADGE[veredictoGlobal]}`}>
                {VLABEL[veredictoGlobal]}
              </span>
              <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                {bv.label}
              </span>
            </div>
            {/* Toggle atribución */}
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
                {(["campana", "portfolio"] as VistaRentabilidad[]).map((v) => (
                  <button key={v} onClick={() => setVistaRentabilidad(v)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition ${
                      vistaRentabilidad === v
                        ? "bg-white shadow-sm text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}>
                    {v === "campana" ? "Por campaña" : "Portfolio total"}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-zinc-400 pr-1">
                {vistaRentabilidad === "campana"
                  ? `gasto: solo campañas con ventas (${FMT_SOL(retornoAtribuido.totalGasto)})`
                  : `gasto: todas las campañas (${FMT_SOL(totalGastoTodasCampanas)})`}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 border-l-4 border-l-amber-400 rounded-xl px-4 py-3">
              <p className="text-[10px] text-zinc-500 uppercase font-medium">Inversión total</p>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">{FMT_SOL(costoTotal)}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                pauta {FMT_SOL(gastoBase)}
                {retornoAtribuido.totalHonorarios > 0 && ` + hon. ${FMT_SOL(retornoAtribuido.totalHonorarios)}`}
              </p>
              {vistaRentabilidad === "portfolio" && totalGastoTodasCampanas !== retornoAtribuido.totalGasto && (
                <p className="text-[9px] text-violet-500 font-medium mt-0.5">
                  incluye {metricas.length} campañas
                </p>
              )}
            </div>

            <div className="bg-white border border-zinc-200 border-l-4 border-l-green-400 rounded-xl px-4 py-3">
              <p className="text-[10px] text-zinc-500 uppercase font-medium">Valor vendido</p>
              <p className="text-sm font-bold text-zinc-900 mt-0.5">{FMT_SOL(retornoAtribuido.totalIngresos)}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                {retornoAtribuido.totalVentas} {retornoAtribuido.totalVentas === 1 ? "propiedad" : "propiedades"}
              </p>
            </div>

            <div className={`bg-white border border-l-4 rounded-xl px-4 py-3 ${
              estadoPct === "excelente" ? "border-zinc-200 border-l-green-400"
              : estadoPct === "aceptable" ? "border-zinc-200 border-l-amber-400"
              : "border-zinc-200 border-l-red-400"
            }`}>
              <p className="text-[10px] text-zinc-500 uppercase font-medium">% costo / valor vendido</p>
              <p className={`text-sm font-bold mt-0.5 ${
                estadoPct === "excelente" ? "text-green-700"
                : estadoPct === "aceptable" ? "text-amber-600"
                : "text-red-500"
              }`}>
                {pct > 0 ? `${pct.toFixed(1)}%` : "—"}
              </p>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${VBADGE[estadoPct]}`}>
                {VLABEL[estadoPct]}
              </span>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                exc ≤ {bv.pctCosto.excelente}% · ace ≤ {bv.pctCosto.aceptable}%
              </p>
            </div>

            <div className={`bg-white border border-l-4 rounded-xl px-4 py-3 ${
              estadoRoasVenta === "excelente" ? "border-zinc-200 border-l-green-400"
              : estadoRoasVenta === "aceptable" ? "border-zinc-200 border-l-amber-400"
              : estadoRoasVenta === "alto" ? "border-zinc-200 border-l-red-400"
              : "border-zinc-200 border-l-zinc-300"
            }`}>
              <p className="text-[10px] text-zinc-500 uppercase font-medium">ROAS de ventas</p>
              <p className={`text-sm font-bold mt-0.5 ${colorMulti}`}>
                {multi !== null ? `${multi.toFixed(1)}x` : "—"}
              </p>
              {estadoRoasVenta && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${VBADGE[estadoRoasVenta]}`}>
                  {VLABEL[estadoRoasVenta]}
                </span>
              )}
              <p className="text-[9px] text-zinc-400 mt-0.5">
                exc ≥ {bv.roasVenta.excelente}x · ace ≥ {bv.roasVenta.aceptable}x
              </p>
            </div>
          </div>

          {/* Narrativa cuantitativa */}
          <div className="bg-gradient-to-br from-zinc-50 to-blue-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-700">¿Qué dice el mercado para {bv.label.toLowerCase()}?</p>

            <div className="flex items-start gap-3">
              <div className="min-w-[4px] self-stretch bg-violet-300 rounded-full" />
              <p className="text-xs text-zinc-600">
                <strong>Por cada S/ 1 invertido</strong> (pauta + honorarios), generaste{" "}
                <strong className={colorMulti}>S/ {multi !== null ? multi.toFixed(2) : "—"}</strong>{" "}
                en valor vendido.{" "}
                {estadoRoasVenta === "excelente" && <span className="text-green-700 font-semibold">Supera el benchmark excelente (≥ {bv.roasVenta.excelente}x).</span>}
                {estadoRoasVenta === "aceptable" && <span className="text-amber-600 font-semibold">Dentro del rango aceptable (≥ {bv.roasVenta.aceptable}x).</span>}
                {estadoRoasVenta === "alto"      && <span className="text-red-500 font-semibold">Bajo el benchmark mínimo (≥ {bv.roasVenta.aceptable}x). A mayor volumen, mejora.</span>}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="min-w-[4px] self-stretch bg-amber-300 rounded-full" />
              <p className="text-xs text-zinc-600">
                El costo comercial fue el{" "}
                <strong className={
                  estadoPct === "excelente" ? "text-green-700"
                  : estadoPct === "aceptable" ? "text-amber-600" : "text-red-500"
                }>{pct > 0 ? `${pct.toFixed(1)}%` : "—"}</strong>{" "}
                del valor vendido — benchmark {bv.label.toLowerCase()}: excelente ≤ {bv.pctCosto.excelente}%, aceptable ≤ {bv.pctCosto.aceptable}%.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="min-w-[4px] self-stretch bg-blue-300 rounded-full" />
              <p className="text-xs text-zinc-500">
                <strong>Referencia práctica</strong> (unidad S/ {bv.ejemploS.toLocaleString("es-PE")}):
                inversión excelente ≤ {FMT_SOL(ejInvExc)} · aceptable ≤ {FMT_SOL(ejInvAce)}.
              </p>
            </div>

            <p className="text-[11px] text-zinc-500 border-t border-zinc-200 pt-2 mt-1 italic">
              {narrativaCierre}
            </p>
          </div>

          {/* Simulador honorario vs comisión */}
          {retornoAtribuido.totalIngresos > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-700">
                Simulador: honorario fijo vs. comisión por venta
                <span className="text-[10px] font-normal text-zinc-400 ml-2">sobre el valor vendido registrado</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3">
                  <p className="text-[10px] text-zinc-500 font-medium uppercase">Honorario cobrado</p>
                  <p className="text-sm font-bold text-zinc-800 mt-1">
                    {retornoAtribuido.totalHonorarios > 0
                      ? FMT_SOL(retornoAtribuido.totalHonorarios)
                      : "No registrado"}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">modelo actual</p>
                </div>
                {([1, 2, 3] as const).map((pct) => {
                  const comision = retornoAtribuido.totalIngresos * pct / 100;
                  const diff     = retornoAtribuido.totalHonorarios > 0
                    ? comision - retornoAtribuido.totalHonorarios : null;
                  const esMayor  = diff !== null && diff > 0;
                  return (
                    <div key={pct} className={`border rounded-xl px-3 py-3 ${esMayor ? "bg-green-50 border-green-200" : "bg-zinc-50 border-zinc-200"}`}>
                      <p className="text-[10px] text-zinc-500 font-medium uppercase">{pct}% comisión</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{FMT_SOL(comision)}</p>
                      {diff !== null && (
                        <p className={`text-[9px] font-semibold mt-0.5 ${esMayor ? "text-green-600" : "text-red-400"}`}>
                          {diff > 0 ? "+" : ""}{FMT_SOL(Math.abs(diff))} {esMayor ? "adicional" : "menos"}
                        </p>
                      )}
                      {diff === null && <p className="text-[9px] text-zinc-400 mt-0.5">vs. no registrado</p>}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                Para que este análisis sea preciso, registra el valor real de las propiedades vendidas en Resultados de campaña.
              </p>
            </div>
          )}

          {/* Fuentes */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-medium text-zinc-500">Benchmarks {bv.label} — fuentes:</p>
            {bv.fuentes.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
                className="block text-[10px] text-blue-500 hover:underline truncate">
                · {f.label}
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
