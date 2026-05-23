/** client/src/components/inteligencia/RegionChart.tsx */

import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { MapPin } from "lucide-react";
import type { RegionEtapa } from "../../services/prospectos.api";

interface Props {
  data: RegionEtapa[];
}

function tasaCierre(d: RegionEtapa) {
  return d.total > 0 ? Math.round((d.cerrados / d.total) * 100) : 0;
}

function colorBarra(tasa: number) {
  if (tasa >= 10) return "bg-emerald-500";
  if (tasa >= 5)  return "bg-blue-400";
  if (tasa >= 2)  return "bg-amber-400";
  return "bg-slate-300";
}

function fmt(n: number) {
  return n >= 1000 ? `S/ ${(n / 1000).toFixed(1)}k` : n > 0 ? `S/ ${n}` : "—";
}

export function RegionChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-xs text-zinc-600">
      Sin datos de región — completa los campos "región" o "ciudad" en los prospectos
    </div>
  );

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const topRegion = data[0];
  const mejorConversion = data.reduce(
    (best, d) => d.cerrados > 0 && tasaCierre(d) > tasaCierre(best) ? d : best,
    data[0]
  );

  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className={HEADER_CLASS}><MapPin size={14} className="mr-2.5 text-rose-500" strokeWidth={2} />Análisis por región</h3>
          <p className="text-xs text-zinc-600 mt-0.5">Distribución geográfica de prospectos</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-zinc-600">Mayor volumen</p>
            <p className="text-sm font-bold text-zinc-800">{topRegion.zona}</p>
            <p className="text-[10px] text-zinc-700">{topRegion.total} prospectos</p>
          </div>
          {mejorConversion.cerrados > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-zinc-600">Mejor conversión</p>
              <p className="text-sm font-bold text-emerald-600">{mejorConversion.zona}</p>
              <p className="text-[10px] text-zinc-700">{tasaCierre(mejorConversion)}% cierre</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {data.map((d) => {
          const pct   = Math.round((d.total / maxTotal) * 100);
          const tasa  = tasaCierre(d);
          return (
            <div key={d.zona}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-zinc-700 font-medium truncate max-w-[140px]">{d.zona}</span>
                  {d.cerrados > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium shrink-0">
                      {tasa}% ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-zinc-600">{fmt(d.valor)}</span>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-700">{d.total}</span>
                    <span className="text-[10px] text-zinc-600 ml-1">total</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${colorBarra(tasa)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[9px] text-zinc-600">{d.activos} activos</span>
                <span className="text-[9px] text-emerald-600">{d.cerrados} cerrados</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-50">
        {[
          { color: "bg-emerald-500", label: "+10% cierre" },
          { color: "bg-blue-400",    label: "5–10%" },
          { color: "bg-amber-400",   label: "2–5%" },
          { color: "bg-slate-300",   label: "<2%" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-zinc-700">
            <span className={`w-2.5 h-2.5 rounded-sm ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
