/** client/src/components/propuestas/ResumenEstadosPropuestas.tsx */

import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { getResumenEstadosPropuestas } from "../../services/propuestas.api";
import type { ResumenEstadoPropuesta } from "../../services/propuestas.api";

const CONFIG: Record<string, { label: string; color: string }> = {
  enviada:         { label: "Enviadas",    color: COLORS.primary },
  en_negociacion:  { label: "Negociación", color: "#a1a1aa" },
  cerrada_ganada:  { label: "Ganadas",     color: "#27272a" },
  cerrada_perdida: { label: "Perdidas",    color: "#f87171" },
  vencida:         { label: "Vencidas",    color: "#d4d4d8" },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}


export function ResumenEstadosPropuestas() {
  const [data, setData] = useState<ResumenEstadoPropuesta[]>([]);

  useEffect(() => {
    getResumenEstadosPropuestas().then(setData).catch(() => {});
  }, []);

  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return null;

  const chartData = Object.entries(CONFIG).map(([estado, cfg]) => {
    const item = data.find((d) => d.estado === estado);
    return {
      estado,
      label:       cfg.label,
      color:       cfg.color,
      total:       item?.total       ?? 0,
      monto_total: item?.monto_total ?? 0,
      pct:         total > 0 ? Math.round(((item?.total ?? 0) / total) * 100) : 0,
    };
  });

  const montoTotal = data.reduce((s, d) => s + d.monto_total, 0);

  return (
  <div className={CARD_CLASS}>

    {/* HEADER */}
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <p className={HEADER_CLASS}>
          <ClipboardList size={14} className="mr-2.5 text-amber-500" strokeWidth={2} />
          Estado de propuestas
        </p>

        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-bold tracking-tight text-zinc-900">
            {total}
          </p>

          <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
            Pipeline activo
          </span>
        </div>

        <p className="text-xs text-zinc-700 mt-1">
          Valor total {fmt(montoTotal)}
        </p>
      </div>

      {/* MINI KPI */}
      <div className="grid grid-cols-2 gap-2 min-w-[180px]">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Ganadas
          </p>

          <p className="text-lg font-bold text-emerald-600 mt-1">
            {chartData.find((d) => d.estado === "cerrada_ganada")?.total ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Negociación
          </p>

          <p className="text-lg font-bold text-amber-500 mt-1">
            {chartData.find((d) => d.estado === "en_negociacion")?.total ?? 0}
          </p>
        </div>
      </div>
    </div>

    {/* LISTA MODERNA */}
    <div className="space-y-3">
      {chartData
        .filter((item) => item.total > 0)
        .map((item) => (
          <div
            key={item.estado}
            className="group rounded-2xl border border-zinc-100 bg-gradient-to-b from-white to-zinc-50/60 p-4 hover:border-zinc-200 hover:shadow-md transition-all duration-300"
          >
            {/* TOP */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 12px ${item.color}55`,
                  }}
                />

                <p className="text-sm font-medium text-zinc-700">
                  {item.label}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">
                  {item.pct}%
                </span>

                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {item.total}
                </span>
              </div>
            </div>

            {/* BARRA */}
            <div className="relative h-2.5 rounded-full bg-zinc-200/70 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.pct}%`,
                  background: `linear-gradient(to right, ${item.color}, ${item.color}CC)`,
                  boxShadow: `0 0 12px ${item.color}55`,
                }}
              />
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-zinc-700">
                {item.total} propuesta
                {item.total !== 1 ? "s" : ""}
              </p>

              <p
                className="text-sm font-semibold"
                style={{
                  color: item.monto_total > 0
                    ? item.color
                    : "#a1a1aa",
                }}
              >
                {fmt(item.monto_total)}
              </p>
            </div>
          </div>
        ))}
    </div>

    {/* FOOTER */}
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
      <div>
        <p className="text-[11px] text-zinc-600 uppercase tracking-wide">
          Conversión
        </p>

        <p className="text-sm font-semibold text-zinc-800 mt-1">
          {total > 0
            ? Math.round(
                ((chartData.find(
                  (d) => d.estado === "cerrada_ganada"
                )?.total ?? 0) /
                  total) *
                  100
              )
            : 0}
          %
        </p>
      </div>

      <div className="text-right">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wide">
          Pipeline total
        </p>

        <p className="text-sm font-semibold text-zinc-800 mt-1">
          {fmt(montoTotal)}
        </p>
      </div>
    </div>
  </div>
);
}
