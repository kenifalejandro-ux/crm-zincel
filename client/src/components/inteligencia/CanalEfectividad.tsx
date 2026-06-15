/** client/src/components/inteligencia/CanalEfectividad.tsx — NEON
 * Antes: barras bg-zinc-800, badges de % bg-zinc-900/bg-zinc-700/bg-zinc-800, header
 * "Mejor canal" text-zinc-100 lavado, footer border-white/8. Ahora: barras con glow,
 * badges por desempeño, header legible. Las barras ya usaban useChartColors. Lógica INTACTA.
 */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { Phone } from "lucide-react";
import { getCanalEfectividad, type CanalEfectividad } from "../../services/inteligencia.api";

const CANAL_LABEL: Record<string, string> = {
  llamada: "Llamada directa", whatsapp: "WhatsApp", correo: "Correo",
  visita: "Visita presencial", redes: "Redes sociales", referido: "Referido",
};

function barTono(i: number, total: number): string {
  if (i === 0)         return "accent"; // mejor canal
  if (i === total - 1) return "axis";   // peor canal
  return "p1";                          // resto
}

export function CanalEfectividadChart() {
  const c = useChartColors();
  const tono: Record<string, string> = { accent: c.accent, axis: c.axis, p1: c.palette[1] };
  const [data, setData] = useState<CanalEfectividad[]>([]);

  useEffect(() => { getCanalEfectividad().then(setData).catch(() => {}); }, []);

  if (!data.length) return null;

  const maxPct = Math.max(...data.map(d => d.pct_conversion), 1);
  const best   = data[0];

  return (
    <div className={CARD_CLASS}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-zinc-500 shrink-0" strokeWidth={2} />
          <div>
            <h3 className={HEADER_CLASS}>Efectividad por canal</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">% de llamadas → interesado · últimos 90 días</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Mejor canal</p>
          <p className="text-[12px] font-bold text-accent mt-0.5">{CANAL_LABEL[best.canal] ?? best.canal}</p>
          <p className="text-[10px] text-zinc-500">{best.pct_conversion}% conversión</p>
        </div>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {data.map((item, i) => {
          const barW = Math.max(Math.round((item.pct_conversion / maxPct) * 100), item.pct_conversion > 0 ? 3 : 0);
          const label = CANAL_LABEL[item.canal] ?? item.canal;
          const isBest = i === 0;
          const col = tono[barTono(i, data.length)];

          // estilo del badge de % por desempeño
          const badgeStyle: React.CSSProperties = isBest
            ? { color: "rgb(var(--accent))", background: "rgb(var(--accent) / 0.15)", border: "1px solid rgb(var(--accent) / 0.35)" }
            : item.pct_conversion >= 10
            ? { color: "#d4d4d8", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }
            : { color: "#a1a1aa", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" };

          return (
            <div key={item.canal} className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-zinc-400 w-32 shrink-0 truncate">{label}</span>

              <div className="flex-1 h-7 bg-white/[0.06] rounded-lg overflow-hidden">
                <div className="h-full rounded-lg flex items-center px-2.5 transition-all duration-700"
                  style={{ width: `${barW}%`, backgroundColor: col, boxShadow: `0 0 10px ${col}66` }}>
                  {barW > 30 && <span className="text-[10px] font-semibold text-white truncate">{label}</span>}
                </div>
              </div>

              <div className="w-36 shrink-0 flex items-center justify-end gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={badgeStyle}>{item.pct_conversion}%</span>
                <span className="text-[11px] text-zinc-500 w-20 text-right">{item.interesados} / {item.total} llamadas</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-zinc-500 mt-4 pt-3 border-t border-white/[0.08]">
        Canales con mínimo 3 llamadas en el período analizado
      </p>
    </div>
  );
}