/** client/src/components/metricas/FormatosTab.tsx
 *
 * Comparativa Tráfico/WhatsApp vs Instáform
 * Métricas de rendimiento + ingresos atribuidos por formato de campaña.
 * Solo usa campana_metricas y resultados_campana.
 */

import { useEffect, useState } from "react";
import { MessageCircle, FileText, TrendingUp, Award } from "lucide-react";
import { getFormatos, FormatoData } from "../../services/metricas.api";

interface Props { empresa?: string }

// ── helpers ──────────────────────────────────────────────────────────────────
const n = (v: unknown) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const S  = (v: unknown) => `S/${n(v).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const Pct = (v: unknown) => `${n(v).toFixed(2)}%`;
const Num = (v: unknown) => n(v).toLocaleString("es-PE");

// ── Config por formato ────────────────────────────────────────────────────────
const CFG = {
  trafico_mensajes: {
    label:    "Tráfico / WhatsApp",
    icon:     MessageCircle,
    color:    "text-green-700",
    bg:       "bg-green-50",
    border:   "border-green-200",
    badge:    "bg-green-100 text-green-700",
    bar:      "bg-green-500",
    desc:     "Campañas orientadas a generar clics y mensajes directos por WhatsApp",
  },
  "instáform": {
    label:    "Instáform (Lead Ads)",
    icon:     FileText,
    color:    "text-blue-700",
    bg:       "bg-blue-50",
    border:   "border-blue-200",
    badge:    "bg-blue-100 text-blue-700",
    bar:      "bg-blue-500",
    desc:     "Campañas con formulario de captación de leads dentro de Meta",
  },
} as const;

type Fmt = keyof typeof CFG;

// ── Métrica de comparación ────────────────────────────────────────────────────
function MetricRow({
  label, sub,
  valA, valB,
  better,
}: {
  label: string; sub?: string;
  valA: string; valB: string;
  better: "a" | "b" | "equal" | "none";
}) {
  const highlight = (side: "a" | "b") =>
    better === side
      ? "font-bold text-emerald-700"
      : better === "equal"
      ? "font-semibold text-zinc-700"
      : "text-zinc-600";

  return (
    <tr className="border-b border-zinc-50 hover:bg-zinc-50">
      <td className="py-2.5 px-4 text-xs text-zinc-600">
        {label}
        {sub && <span className="block text-[10px] text-zinc-400">{sub}</span>}
      </td>
      <td className={`py-2.5 px-4 text-xs text-center ${highlight("a")}`}>{valA}</td>
      <td className={`py-2.5 px-4 text-xs text-center ${highlight("b")}`}>{valB}</td>
    </tr>
  );
}

// ── Barra visual proporcional ─────────────────────────────────────────────────
function PropBar({ label, valueA, valueB, colorA, colorB, fmt }: {
  label: string;
  valueA: number; valueB: number;
  colorA: string; colorB: string;
  fmt: (v: number) => string;
}) {
  const total = valueA + valueB;
  const pctA  = total > 0 ? (valueA / total) * 100 : 50;
  const pctB  = 100 - pctA;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{label}</span>
        <span className="text-zinc-400">{fmt(valueA)} vs {fmt(valueB)}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100">
        <div className={`h-full ${colorA} transition-all`} style={{ width: `${pctA}%` }} />
        <div className={`h-full ${colorB} transition-all`} style={{ width: `${pctB}%` }} />
      </div>
    </div>
  );
}

// ── Veredicto automático ──────────────────────────────────────────────────────
function Veredicto({ formatos }: { formatos: FormatoData[] }) {
  const trafico  = formatos.find(f => f.formato === "trafico_mensajes");
  const instForm = formatos.find(f => f.formato === "instáform");

  const puntos: string[] = [];
  let ganador: string | null = null;

  if (trafico && instForm) {
    // Revenue
    if (n(trafico.revenue_total) > n(instForm.revenue_total)) {
      puntos.push(`Tráfico/WhatsApp generó ${S(trafico.revenue_total)} en ingresos vs ${S(instForm.revenue_total)} del Instáform.`);
      ganador = "Tráfico / WhatsApp";
    } else if (n(instForm.revenue_total) > 0) {
      puntos.push(`Instáform generó ${S(instForm.revenue_total)} en ingresos vs ${S(trafico.revenue_total)} del tráfico.`);
      ganador = "Instáform";
    }
    // Mensajes vs leads
    if (n(trafico.mensajes_total) > 0 && n(instForm.leads_total) > 0) {
      puntos.push(`${Num(trafico.mensajes_total)} mensajes WhatsApp vs ${Num(instForm.leads_total)} leads de formulario — mayor volumen de contacto por tráfico.`);
    }
    // CTR
    if (n(trafico.ctr_promedio) > n(instForm.ctr_promedio)) {
      puntos.push(`CTR más alto en tráfico (${Pct(trafico.ctr_promedio)}) vs Instáform (${Pct(instForm.ctr_promedio)}) — el anuncio de tráfico atrae más clics.`);
    } else if (n(instForm.ctr_promedio) > n(trafico.ctr_promedio)) {
      puntos.push(`CTR más alto en Instáform (${Pct(instForm.ctr_promedio)}) vs tráfico (${Pct(trafico.ctr_promedio)}).`);
    }
    // Costo por resultado
    if (n(trafico.costo_por_mensaje) > 0 && n(instForm.costo_por_lead) > 0) {
      puntos.push(`Costo por contacto: ${S(trafico.costo_por_mensaje)}/mensaje (tráfico) vs ${S(instForm.costo_por_lead)}/lead (Instáform).`);
    }
  } else if (trafico && n(trafico.revenue_total) > 0) {
    ganador = "Tráfico / WhatsApp";
    puntos.push(`Solo tráfico/WhatsApp tiene ingresos atribuidos: ${S(trafico.revenue_total)}.`);
  }

  if (!puntos.length) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-500">
        Registra ventas en ResultadosPage para activar el veredicto automático.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Award size={15} className="text-amber-600" />
        <p className="text-sm font-bold text-zinc-800">
          Veredicto {ganador ? `— Gana: ${ganador}` : ""}
        </p>
      </div>
      <ul className="space-y-1.5">
        {puntos.map((p, i) => (
          <li key={i} className="text-xs text-zinc-700 flex gap-2">
            <span className="text-amber-500 shrink-0">•</span>
            {p}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-zinc-500 border-t border-amber-100 pt-2">
        Basado en datos reales registrados. Agrega más ventas en ResultadosPage para mayor precisión.
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const FormatosTab = ({ empresa }: Props) => {
  const [data,    setData]    = useState<FormatoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFormatos(empresa)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [empresa]);

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Cargando formatos…</div>
  );
  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">Error: {error}</div>
  );
  if (!data.length) return (
    <div className="p-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-center text-sm text-zinc-500">
      Selecciona una empresa para ver la comparativa de formatos.
    </div>
  );

  const trafico  = data.find(f => f.formato === "trafico_mensajes");
  const instForm = data.find(f => f.formato === "instáform");

  const totalGasto = n(trafico?.gasto_total) + n(instForm?.gasto_total);

  return (
    <div className="space-y-6">

      {/* ── Cards por formato ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map(f => {
          const cfg = CFG[f.formato as Fmt] ?? CFG.trafico_mensajes;
          const Icon = cfg.icon;
          const pctGasto = totalGasto > 0 ? (n(f.gasto_total) / totalGasto * 100).toFixed(0) : "0";
          return (
            <div key={f.formato} className={`border rounded-xl p-5 space-y-4 ${cfg.bg} ${cfg.border}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={cfg.color} />
                  <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {f.campanas} campaña{f.campanas !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{cfg.desc}</p>

              {/* KPIs principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500">Gasto total</p>
                  <p className={`text-lg font-bold ${cfg.color}`}>{S(f.gasto_total)}</p>
                  <p className="text-[10px] text-zinc-400">{pctGasto}% del total</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500">
                    {f.formato === "trafico_mensajes" ? "Mensajes recibidos" : "Leads captados"}
                  </p>
                  <p className={`text-lg font-bold ${cfg.color}`}>
                    {f.formato === "trafico_mensajes" ? Num(f.mensajes_total) : Num(f.leads_total)}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {f.formato === "trafico_mensajes"
                      ? (n(f.costo_por_mensaje) > 0 ? `${S(f.costo_por_mensaje)}/mensaje` : "sin costo por mensaje")
                      : (n(f.costo_por_lead) > 0 ? `${S(f.costo_por_lead)}/lead` : "sin costo por lead")}
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500">CTR promedio</p>
                  <p className={`text-lg font-bold ${cfg.color}`}>{Pct(f.ctr_promedio)}</p>
                  <p className="text-[10px] text-zinc-400">{Num(f.clics_total)} clics totales</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500">Ingresos atribuidos</p>
                  <p className={`text-lg font-bold ${n(f.revenue_total) > 0 ? "text-emerald-700" : "text-zinc-400"}`}>
                    {n(f.revenue_total) > 0 ? S(f.revenue_total) : "—"}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {n(f.ventas) > 0 ? `${f.ventas} venta${f.ventas !== 1 ? "s" : ""} · ROAS ${n(f.roas_real)}x` : "Sin ventas registradas"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Barras proporcionales ── */}
      {trafico && instForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <TrendingUp size={14} className="text-violet-500" />
            Distribución comparativa
          </p>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500 mb-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Tráfico/WhatsApp</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Instáform</span>
          </div>
          <div className="space-y-2.5">
            <PropBar label="Gasto invertido" valueA={n(trafico.gasto_total)} valueB={n(instForm.gasto_total)} colorA="bg-green-500" colorB="bg-blue-500" fmt={S} />
            <PropBar label="Impresiones" valueA={n(trafico.impresiones_total)} valueB={n(instForm.impresiones_total)} colorA="bg-green-400" colorB="bg-blue-400" fmt={Num} />
            <PropBar label="Clics" valueA={n(trafico.clics_total)} valueB={n(instForm.clics_total)} colorA="bg-green-400" colorB="bg-blue-400" fmt={Num} />
            <PropBar label="Mensajes + Leads" valueA={n(trafico.mensajes_total)} valueB={n(instForm.leads_total)} colorA="bg-green-500" colorB="bg-blue-500" fmt={Num} />
            <PropBar label="Ingresos atribuidos" valueA={n(trafico.revenue_total)} valueB={n(instForm.revenue_total)} colorA="bg-emerald-500" colorB="bg-blue-600" fmt={S} />
          </div>
        </div>
      )}

      {/* ── Tabla comparativa detallada ── */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-800">Métricas detalladas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Métrica</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-green-700">Tráfico / WhatsApp</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-blue-700">Instáform</th>
              </tr>
            </thead>
            <tbody>
              {/* Alcance */}
              <tr className="bg-zinc-50/50"><td colSpan={3} className="px-4 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Alcance y actividad</td></tr>
              <MetricRow label="Campañas" valA={Num(trafico?.campanas)} valB={Num(instForm?.campanas)} better="none" />
              <MetricRow label="Impresiones" valA={Num(trafico?.impresiones_total)} valB={Num(instForm?.impresiones_total)} better={n(trafico?.impresiones_total) >= n(instForm?.impresiones_total) ? "a" : "b"} />
              <MetricRow label="Clics totales" valA={Num(trafico?.clics_total)} valB={Num(instForm?.clics_total)} better={n(trafico?.clics_total) >= n(instForm?.clics_total) ? "a" : "b"} />
              <MetricRow label="CTR promedio" sub="tasa de clic en el anuncio" valA={Pct(trafico?.ctr_promedio)} valB={Pct(instForm?.ctr_promedio)} better={n(trafico?.ctr_promedio) >= n(instForm?.ctr_promedio) ? "a" : "b"} />
              <MetricRow label="CPM promedio" sub="costo por 1,000 impresiones" valA={n(trafico?.cpm_promedio) > 0 ? S(trafico?.cpm_promedio) : "—"} valB={n(instForm?.cpm_promedio) > 0 ? S(instForm?.cpm_promedio) : "—"} better={n(trafico?.cpm_promedio) > 0 && n(instForm?.cpm_promedio) > 0 ? (n(trafico?.cpm_promedio) <= n(instForm?.cpm_promedio) ? "a" : "b") : "none"} />
              <MetricRow label="Frecuencia promedio" sub="veces que un usuario vio el anuncio" valA={n(trafico?.frecuencia_promedio) > 0 ? n(trafico?.frecuencia_promedio).toFixed(1) : "—"} valB={n(instForm?.frecuencia_promedio) > 0 ? n(instForm?.frecuencia_promedio).toFixed(1) : "—"} better="none" />

              {/* Resultados */}
              <tr className="bg-zinc-50/50"><td colSpan={3} className="px-4 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Resultados de contacto</td></tr>
              <MetricRow label="Mensajes WhatsApp" valA={Num(trafico?.mensajes_total)} valB="—" better="none" />
              <MetricRow label="Leads formulario" valA="—" valB={Num(instForm?.leads_total)} better="none" />
              <MetricRow label="Costo por mensaje" valA={n(trafico?.costo_por_mensaje) > 0 ? S(trafico?.costo_por_mensaje) : "—"} valB="—" better="none" />
              <MetricRow label="Costo por lead form" valA="—" valB={n(instForm?.costo_por_lead) > 0 ? S(instForm?.costo_por_lead) : "—"} better="none" />
              <MetricRow label="Mensajes / 1,000 imp." valA={n(trafico?.mensajes_por_1000_imp) > 0 ? n(trafico?.mensajes_por_1000_imp).toFixed(2) : "—"} valB="—" better="none" />
              <MetricRow label="Leads / 1,000 imp." valA="—" valB={n(instForm?.leads_por_1000_imp) > 0 ? n(instForm?.leads_por_1000_imp).toFixed(2) : "—"} better="none" />

              {/* Revenue */}
              <tr className="bg-zinc-50/50"><td colSpan={3} className="px-4 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Rentabilidad</td></tr>
              <MetricRow label="Gasto total" valA={S(trafico?.gasto_total)} valB={S(instForm?.gasto_total)} better="none" />
              <MetricRow label="Ventas atribuidas" valA={Num(trafico?.ventas)} valB={Num(instForm?.ventas)} better={n(trafico?.ventas) >= n(instForm?.ventas) ? "a" : "b"} />
              <MetricRow label="Ingresos" valA={n(trafico?.revenue_total) > 0 ? S(trafico?.revenue_total) : "—"} valB={n(instForm?.revenue_total) > 0 ? S(instForm?.revenue_total) : "—"} better={n(trafico?.revenue_total) >= n(instForm?.revenue_total) ? (n(trafico?.revenue_total) > 0 ? "a" : "none") : "b"} />
              <MetricRow label="ROAS real" sub="ingresos / gasto" valA={n(trafico?.roas_real) > 0 ? `${n(trafico?.roas_real)}x` : "—"} valB={n(instForm?.roas_real) > 0 ? `${n(instForm?.roas_real)}x` : "—"} better={n(trafico?.roas_real) >= n(instForm?.roas_real) ? (n(trafico?.roas_real) > 0 ? "a" : "none") : "b"} />
              <MetricRow label="Costo por venta" valA={n(trafico?.costo_por_venta) > 0 ? S(trafico?.costo_por_venta) : "—"} valB={n(instForm?.costo_por_venta) > 0 ? S(instForm?.costo_por_venta) : "—"} better={n(trafico?.costo_por_venta) > 0 && n(instForm?.costo_por_venta) > 0 ? (n(trafico?.costo_por_venta) <= n(instForm?.costo_por_venta) ? "a" : "b") : "none"} />
              <MetricRow label="Margen bruto" valA={n(trafico?.margen_pct) > 0 ? Pct(trafico?.margen_pct) : "—"} valB={n(instForm?.margen_pct) > 0 ? Pct(instForm?.margen_pct) : "—"} better={n(trafico?.margen_pct) >= n(instForm?.margen_pct) ? (n(trafico?.margen_pct) > 0 ? "a" : "none") : "b"} />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Veredicto ── */}
      <Veredicto formatos={data} />

    </div>
  );
};
