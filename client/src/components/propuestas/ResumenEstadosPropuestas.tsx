/** client/src/components/propuestas/ResumenEstadosPropuestas.tsx — PREMIUM NEON
 * Antes: tiles y mini-KPIs en TEMA CLARO (bg-yellow-50/green-50/red-50/zinc-50,
 * border-*-100/200) + labels text-zinc-100 lavados. Ahora: donut con glow, KPIs
 * translúcidos por color y tiles de estado con icono + barra de progreso + %.
 * Lógica (carga, drill-down, useChartColors) INTACTA.
 */

import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getResumenEstadosPropuestas, getKanbanOportunidades } from "../../services/propuestas.api";
import type { ResumenEstadoPropuesta, OportunidadKanban } from "../../services/propuestas.api";
import { NeonDonut } from "../ui/NeonDonut";
import { DrilldownModal } from "../inteligencia/DrilldownModal";
import type { LeadDrilldown } from "../inteligencia/DrilldownModal";

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}

// hex === "accent" → usa rgb(var(--accent))
const ESTADOS = [
  { key: "enviada",         label: "Enviadas",    hex: "accent",  Icon: Clock },
  { key: "en_negociacion",  label: "Negociación", hex: "#a855f7", Icon: TrendingUp },
  { key: "cerrada_ganada",  label: "Ganadas",     hex: "#34d399", Icon: CheckCircle2 },
  { key: "cerrada_perdida", label: "Perdidas",    hex: "#f87171", Icon: XCircle },
  { key: "vencida",         label: "Vencidas",    hex: "#71717a", Icon: AlertCircle },
] as const;

const isAccent = (h: string) => h === "accent";
const solid    = (h: string) => isAccent(h) ? "rgb(var(--accent))" : h;
const bgTint   = (h: string) => isAccent(h) ? "rgb(var(--accent) / 0.06)" : `${h}0f`;
const bgTintK  = (h: string) => isAccent(h) ? "rgb(var(--accent) / 0.07)" : `${h}12`;
const brd      = (h: string) => isAccent(h) ? "rgb(var(--accent) / 0.3)"  : `${h}33`;
const glow     = (h: string) => isAccent(h) ? "rgb(var(--accent) / calc(0.5*var(--glow)))" : `${h}66`;

interface Props {
  filtroPeriodo?:    string;
  mesSeleccionado?:  { mes: number; anio: number };
  diaSeleccionado?:  string;
}

export function ResumenEstadosPropuestas({ filtroPeriodo, mesSeleccionado, diaSeleccionado }: Props) {
  const c = useChartColors(); // re-render al cambiar el acento del Tweaks
  const [data,    setData]    = useState<ResumenEstadoPropuesta[]>([]);
  const [kanban,  setKanban]  = useState<Record<string, OportunidadKanban[]>>({});
  const [drill,   setDrill]   = useState<{ estado: string; label: string } | null>(null);

  useEffect(() => {
    const params: { periodo?: string; mes?: number; anio?: number; fecha?: string } = {};
    if (filtroPeriodo) params.periodo = filtroPeriodo;
    if (filtroPeriodo === "mes" && mesSeleccionado) {
      params.mes  = mesSeleccionado.mes + 1;
      params.anio = mesSeleccionado.anio;
    }
    if (filtroPeriodo === "dia" && diaSeleccionado) params.fecha = diaSeleccionado;

    getResumenEstadosPropuestas(params).then(setData).catch(() => {});
    getKanbanOportunidades().then(({ porEstado }) => setKanban(porEstado)).catch(() => {});
  }, [filtroPeriodo, mesSeleccionado, diaSeleccionado]);

  const total = data.reduce((s, d) => s + d.total, 0);

  const chartData = ESTADOS.map(e => {
    const item = data.find(d => d.estado === e.key);
    return { label: e.label, value: item?.total ?? 0, color: solid(e.hex) };
  }).filter(d => d.value > 0);

  const montoTotal = data.reduce((s, d) => s + d.monto_total, 0);
  const ganadas    = data.find(d => d.estado === "cerrada_ganada")?.total ?? 0;
  const perdidas   = data.find(d => d.estado === "cerrada_perdida")?.total ?? 0;
  const activas    = (data.find(d => d.estado === "enviada")?.total ?? 0) + (data.find(d => d.estado === "en_negociacion")?.total ?? 0);
  const conversion = (ganadas + perdidas) > 0 ? Math.round(ganadas / (ganadas + perdidas) * 100) : 0;

  const kpis = [
    { label: "Ganadas",    value: ganadas,          hex: "#34d399" },
    { label: "Activas",    value: activas,          hex: "accent"  },
    { label: "Conversión", value: `${conversion}%`, hex: "#a855f7" },
    { label: "Pipeline",   value: fmt(montoTotal),  hex: "#fbbf24", small: true },
  ];

  function getDrillLeads(estado: string): LeadDrilldown[] {
    const ops = kanban[estado] ?? [];
    return ops.map(op => ({
      id:              op.prospecto_id,
      empresa:         op.empresa,
      nombre_contacto: op.nombre_contacto,
      telefono:        op.telefono,
      ciudad:          op.ciudad,
      etapa_pipeline:  undefined,
      extra:           op.monto_propuesto > 0 ? fmt(op.moneda === "USD" ? op.monto_propuesto * op.tipo_cambio : op.monto_propuesto) : undefined,
    }));
  }

  return (
    <div className={CARD_CLASS}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={14} className="text-amber-400 shrink-0" strokeWidth={2} />
        <div>
          <h3 className={HEADER_CLASS}>Estado de propuestas</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">{total} propuestas · clic para ver empresas</p>
        </div>
      </div>

      {total === 0 && (
        <p className="text-xs text-zinc-500 text-center py-6">Sin propuestas en el período seleccionado</p>
      )}

      {/* KPIs + Donut */}
      {total > 0 && <div className="flex items-center gap-4 mb-5">
        <NeonDonut
          data={chartData.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          size={112}
          centerValue={total}
          centerLabel="total"
        />

        <div className="flex-1 grid grid-cols-2 gap-2">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl p-2.5 text-center" style={{ background: bgTintK(k.hex), border: `1px solid ${brd(k.hex)}` }}>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide">{k.label}</p>
              <p className={`font-display font-bold tabular-nums ${k.small ? "text-sm" : "text-xl"}`}
                 style={{ color: solid(k.hex), textShadow: `0 0 10px ${glow(k.hex)}` }}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>}

      {/* Tiles clickeables por estado */}
      {total > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ESTADOS.map(e => {
          const item = data.find(d => d.estado === e.key);
          if (!item || item.total === 0) return null;
          const pct = Math.round((item.total / total) * 100);
          const col = solid(e.hex);
          const Icon = e.Icon;
          return (
            <button
              key={e.key}
              onClick={() => setDrill({ estado: e.key, label: e.label })}
              className="flex items-center gap-3 rounded-xl p-3 text-left transition hover:scale-[1.02]"
              style={{ background: bgTint(e.hex), border: `1px solid ${brd(e.hex)}` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: isAccent(e.hex) ? "rgb(var(--accent) / 0.14)" : `${e.hex}1f`, color: col }}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-100">{e.label}</p>
                <p className="text-[10px] text-zinc-500">{fmt(item.monto_total)}</p>
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-base font-bold tabular-nums" style={{ color: col }}>{item.total}</p>
                <p className="text-[10px] text-zinc-500">{pct}%</p>
              </div>
            </button>
          );
        })}
      </div>}

      {/* Drill-down modal */}
      {drill && (
        <DrilldownModal
          titulo={drill.label}
          leads={getDrillLeads(drill.estado)}
          onCerrar={() => setDrill(null)}
        />
      )}
    </div>
  );
}