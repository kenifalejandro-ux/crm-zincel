/** client/src/components/inteligencia/CanalEfectividad.tsx */

import { useEffect, useState } from "react";
import { COLORS, CARD_CLASS, HEADER_CLASS, BADGE_BASE } from "../../lib/tokens";
import { Phone } from "lucide-react";
import { getCanalEfectividad, type CanalEfectividad } from "../../services/inteligencia.api";

const CANAL_LABEL: Record<string, string> = {
  llamada:  "Llamada directa",
  whatsapp: "WhatsApp",
  correo:   "Correo",
  visita:   "Visita presencial",
  redes:    "Redes sociales",
  referido: "Referido",
};

function barFill(i: number, total: number): string {
  if (i === 0)              return COLORS.primary;   // mejor canal: dorado
  if (i === total - 1)      return COLORS.mutedDark; // peor canal: gris suave
  return COLORS.dark;                                 // resto: zinc oscuro
}

export function CanalEfectividadChart() {
  const [data, setData] = useState<CanalEfectividad[]>([]);

  useEffect(() => {
    getCanalEfectividad().then(setData).catch(() => {});
  }, []);

  if (!data.length) return null;

  const maxPct = Math.max(...data.map(d => d.pct_conversion), 1);
  const best   = data[0];

  return (
    <div className={CARD_CLASS}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-zinc-500 shrink-0" strokeWidth={2} />
          <div>
            <h3 className={HEADER_CLASS}>Efectividad por canal</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              % de llamadas → interesado · últimos 90 días
            </p>
          </div>
        </div>
        {/* Badge mejor canal */}
        <div className="shrink-0 text-right">
          <p className="text-[9px] text-zinc-100 uppercase tracking-wider">Mejor canal</p>
          <p className="text-[12px] font-bold text-zinc-200 mt-0.5">
            {CANAL_LABEL[best.canal] ?? best.canal}
          </p>
          <p className="text-[10px] text-zinc-500">{best.pct_conversion}% conversión</p>
        </div>
      </div>

      {/* ── Barras ── */}
      <div className="space-y-3">
        {data.map((item, i) => {
          const barW   = Math.max(Math.round((item.pct_conversion / maxPct) * 100), item.pct_conversion > 0 ? 3 : 0);
          const label  = CANAL_LABEL[item.canal] ?? item.canal;
          const isBest = i === 0;

          return (
            <div key={item.canal} className="flex items-center gap-3">

              {/* Label */}
              <span className="text-[12px] font-medium text-zinc-400 w-32 shrink-0 truncate">
                {label}
              </span>

              {/* Barra */}
              <div className="flex-1 h-7 bg-zinc-800 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center px-2.5 transition-all duration-700"
                  style={{ width: `${barW}%`, backgroundColor: barFill(i, data.length) }}
                >
                  {barW > 30 && (
                    <span className="text-[10px] font-semibold text-white truncate">{label}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="w-36 shrink-0 flex items-center justify-end gap-2">
                <span className={`${BADGE_BASE} text-[11px] font-bold px-2 py-0.5 ${ isBest ? "bg-zinc-900 text-white" : item.pct_conversion >= 10 ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-500" }`}>
                  {item.pct_conversion}%
                </span>
                <span className="text-[11px] text-zinc-400 w-20 text-right">
                  {item.interesados} / {item.total} llamadas
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <p className="text-[10px] text-zinc-400 mt-4 pt-3 border-t border-white/8">
        Canales con mínimo 3 llamadas en el período analizado
      </p>
    </div>
  );
}
