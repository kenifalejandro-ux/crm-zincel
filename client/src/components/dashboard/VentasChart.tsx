/** client/src/components/dashboard/VentasChart.tsx — PREMIUM NEON
 * Antes: FunnelChart de recharts + stats sueltos. Ahora: embudo visual con glow y
 * % de conversión por etapa (Total → En proceso → Cerradas), KPIs de estado en cards
 * de color y desglose por servicio con montos. Sin recharts. Props (metricas) INTACTAS.
 */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { DollarSign } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function VentasChart({ metricas }: Props) {
  const c = useChartColors();
  const { cerradas = 0, en_proceso = 0, no: sinVenta = 0 } = metricas.ventas ?? {};
  const porServicio = metricas.ventas_por_servicio ?? [];
  const total       = cerradas + en_proceso + sinVenta;
  const tasaCierre  = total > 0 ? Math.round((cerradas / total) * 100) : 0;

  // Embudo: Total → En proceso (incluye cerradas) → Cerradas
  const etapas = [
    { name: "Total leads", value: total,                 hex: c.palette[1] },
    { name: "En proceso",  value: en_proceso + cerradas, hex: c.accent     },
    { name: "Cerradas",    value: cerradas,              hex: c.success    },
  ];
  const maxE = etapas[0].value || 1;

  const stats = [
    { label: "Total",      valor: total,      hex: c.palette[1] },
    { label: "En proceso", valor: en_proceso, hex: c.accent     },
    { label: "Cerradas",   valor: cerradas,   hex: c.success    },
    { label: "Sin venta",  valor: sinVenta,   hex: c.danger     },
  ];
  const maxMonto = porServicio[0]?.monto_total ?? 1;

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-4`}>
      <h2 className={HEADER_CLASS}>
        <DollarSign size={14} className="mr-2.5 text-emerald-400" strokeWidth={2} />
        Estado de Ventas
        <span className="ml-auto flex items-baseline gap-1">
          <span className="font-display text-lg font-bold tabular-nums" style={{ color: tasaCierre >= 30 ? "#34d399" : "#fbbf24" }}>{tasaCierre}%</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wide normal-case">cierre</span>
        </span>
      </h2>

      {total === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">Sin registros de ventas</p>
      ) : (
        <>
          {/* Embudo */}
          <div className="space-y-1.5">
            {etapas.map((e, i) => {
              const w = Math.max((e.value / maxE) * 100, 12);
              const conv = i > 0 && etapas[i - 1].value > 0 ? Math.round((e.value / etapas[i - 1].value) * 100) : null;
              return (
                <div key={e.name} className="flex items-center gap-3">
                  <div className="flex-1 flex justify-center">
                    <div className="h-9 rounded-lg flex items-center justify-between px-3 transition-all"
                      style={{ width: `${w}%`, background: `linear-gradient(90deg, ${e.hex}cc, ${e.hex}77)`, boxShadow: `0 0 14px ${e.hex}55`, border: `1px solid ${e.hex}` }}>
                      <span className="text-[10px] font-semibold text-white/90 truncate">{e.name}</span>
                      <span className="font-display text-sm font-bold text-white tabular-nums">{e.value}</span>
                    </div>
                  </div>
                  <span className="w-9 text-[10px] text-zinc-500 tabular-nums shrink-0">{conv !== null ? `${conv}%` : ""}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {stats.map((s) => (
              <div key={s.label} className="text-center rounded-xl py-2.5 px-1" style={{ background: `${s.hex}10`, border: `1px solid ${s.hex}2e` }}>
                <p className="font-display text-xl font-bold tabular-nums leading-none" style={{ color: s.hex, textShadow: `0 0 10px ${s.hex}55` }}>{s.valor}</p>
                <p className="text-[9px] text-zinc-500 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Por servicio */}
      {porServicio.length > 0 && (
        <div className="border-t border-white/[0.08] pt-4">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Por servicio (cerradas)
          </p>
          <div className="space-y-3">
            {porServicio.map((s, i) => {
              const pct = Math.round((s.monto_total / maxMonto) * 100);
              const col = c.palette[i % c.palette.length];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-zinc-400 capitalize truncate max-w-[130px]">
                      {s.servicio.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-zinc-500">{s.cantidad} und</span>
                      <span className="text-[12px] font-semibold text-zinc-100 tabular-nums">
                        S/ {s.monto_total.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}