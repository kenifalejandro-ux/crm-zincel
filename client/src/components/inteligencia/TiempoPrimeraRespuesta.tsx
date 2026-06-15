/** client/src/components/inteligencia/TiempoPrimeraRespuesta.tsx — PREMIUM NEON
 * Antes: icono bg-amber-50, KPIs bg-zinc-800/40 con text-zinc-800 (lavado sobre dark),
 * grid #f4f4f5, badges velocidad text-emerald-600/amber-600/red-500. Ahora: neon.
 * El area chart ya usaba useChartColors. Lógica/datos INTACTOS.
 */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Zap } from "lucide-react";
import { getTiempoPrimeraRespuesta, type TiempoPrimeraRespuesta } from "../../services/inteligencia.api";

const TooltipArea = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-1.5 text-xs`}>
      <p className="font-semibold text-zinc-200">{label}</p>
      <p className="text-zinc-400">{payload[0].value} prospectos · {payload[0].payload.pct}%</p>
    </div>
  );
};

function velocidadLabel(dias: number | null): { label: string; cls: string } {
  if (dias === null) return { label: "Sin datos", cls: "text-zinc-500" };
  if (dias < 1)     return { label: "Excelente",  cls: "text-emerald-400" };
  if (dias <= 3)    return { label: "Aceptable",  cls: "text-amber-400" };
  return              { label: "Lento",          cls: "text-red-400" };
}

export function TiempoPrimeraRespuestaChart() {
  const c = useChartColors();
  const [data, setData] = useState<TiempoPrimeraRespuesta | null>(null);

  useEffect(() => {
    getTiempoPrimeraRespuesta().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const vel      = velocidadLabel(data.promedio_dias);
  const hasDatos = data.distribucion.some(d => d.valor > 0);

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <Zap size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className={HEADER_CLASS}>Tiempo de primera respuesta</h3>
          <p className="text-[11px] text-zinc-500">Días promedio entre creación del lead y primer contacto</p>
        </div>
      </div>

      {/* KPIs mín/prom/máx */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Mínimo",   value: data.minimo_dias,   color: "#34d399" },
          { label: "Promedio", value: data.promedio_dias, color: "#f4f4f5" },
          { label: "Máximo",   value: data.maximo_dias,   color: "#f87171" },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 text-center">
            <p className="font-display text-lg font-bold leading-none tabular-nums" style={{ color: s.color, textShadow: s.color !== "#f4f4f5" ? `0 0 10px ${s.color}55` : "none" }}>
              {s.value !== null ? `${s.value}d` : "—"}
            </p>
            <p className="text-[9px] text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      {hasDatos ? (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data.distribucion} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="gradTiempo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={c.accent} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} />
            <Tooltip content={<TooltipArea />} />
            <Area filter="url(#neon-glow)"
              type="monotone" dataKey="valor"
              stroke={c.accent} fill="url(#gradTiempo)" strokeWidth={2}
              dot={{ fill: c.accent, r: 3, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-xs text-zinc-500">Sin datos de distribución</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/[0.08] flex justify-between items-center text-[10px]">
        <span className="text-zinc-400">{data.total_con_contacto} con primer contacto</span>
        <span className={`font-bold ${vel.cls}`}>{vel.label}</span>
        <span className="text-red-400">{data.sin_contacto} sin contactar</span>
      </div>
    </div>
  );
}