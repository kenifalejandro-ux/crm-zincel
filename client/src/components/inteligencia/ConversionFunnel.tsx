/** client/src/components/inteligencia/ConversionFunnel.tsx */

import { COLORS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { getConversionFunnel, type ConversionFunnel } from "../../services/inteligencia.api";

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta enviada",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado ganado",
};

const ETAPA_COLOR: Record<string, string> = {
  nuevo:             "#d4d4d8",
  contactado:        "#a1a1aa",
  interesado:        COLORS.primary,
  propuesta_enviada: COLORS.primary,
  negociacion:       "#71717a",
  cerrado_ganado:    "#27272a",
};

export function ConversionFunnelChart() {
  const [data, setData] = useState<ConversionFunnel | null>(null);

  useEffect(() => {
    getConversionFunnel().then(setData).catch(() => {});
  }, []);

  if (!data || data.etapas.length === 0) return null;

  const maxTotal = Math.max(...data.etapas.map((e) => e.total), 1);

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50">
            <Filter size={14} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tasa de conversión por etapa del funnel</h3>
            <p className="text-[11px] text-zinc-400">% de leads que avanzan entre etapas · identifica el cuello de botella</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-zinc-400">Conversión global</p>
          <p className="text-lg font-bold text-violet-700">{data.tasa_global}%</p>
        </div>
      </div>

      {/* Funnel visual */}
      <div className="space-y-1.5">
        {data.etapas.map((etapa, i) => {
          const pct    = Math.round((etapa.total / maxTotal) * 100);
          const color  = ETAPA_COLOR[etapa.etapa] ?? "#a1a1aa";
          const label  = ETAPA_LABEL[etapa.etapa] ?? etapa.etapa;
          const convPct = etapa.pct_conversion;

          return (
            <div key={etapa.etapa}>
              {/* Conversion arrow between stages */}
              {i > 0 && convPct !== null && (
                <div className="flex items-center gap-2 py-0.5 pl-2">
                  <div className="w-px h-3 bg-gray-200 mx-2" />
                  <span className={`text-[10px] font-semibold ${
                    convPct >= 50 ? "text-emerald-600" :
                    convPct >= 25 ? "text-amber-600" :
                    "text-red-500"
                  }`}>
                    ↓ {convPct}% pasan
                  </span>
                </div>
              )}

              {/* Stage bar */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 w-28 shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, 4)}%`,
                      background: color,
                    }}
                  >
                    {pct > 15 && (
                      <span className="text-[10px] font-bold text-white">{etapa.total}</span>
                    )}
                  </div>
                </div>
                {pct <= 15 && (
                  <span className="text-[10px] font-semibold text-zinc-600 w-6 text-right">{etapa.total}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Perdidos / descartados */}
      {(data.perdidos > 0 || data.descartados > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs">
          <span className="text-zinc-400">Fuera del funnel:</span>
          {data.perdidos > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-zinc-500">Perdidos:</span>
              <span className="font-semibold text-red-500">{data.perdidos}</span>
            </span>
          )}
          {data.descartados > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
              <span className="text-zinc-500">Descartados:</span>
              <span className="font-semibold text-zinc-500">{data.descartados}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
