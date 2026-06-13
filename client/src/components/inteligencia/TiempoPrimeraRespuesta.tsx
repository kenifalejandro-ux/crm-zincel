/** client/src/components/inteligencia/TiempoPrimeraRespuesta.tsx */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS, COLORS, TOOLTIP_BASE } from "../../lib/tokens";
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
  if (dias === null) return { label: "Sin datos", cls: "text-zinc-600" };
  if (dias < 1)     return { label: "Excelente",  cls: "text-emerald-600" };
  if (dias <= 3)    return { label: "Aceptable",  cls: "text-amber-600" };
  return              { label: "Lento",          cls: "text-red-500" };
}

export function TiempoPrimeraRespuestaChart() {
  const [data, setData] = useState<TiempoPrimeraRespuesta | null>(null);

  useEffect(() => {
    getTiempoPrimeraRespuesta().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const vel     = velocidadLabel(data.promedio_dias);
  const hasDatos = data.distribucion.some(d => d.valor > 0);

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-amber-50">
          <Zap size={14} className="text-amber-500" />
        </div>
        <div>
          <h3 className={HEADER_CLASS}>Tiempo de primera respuesta</h3>
          <p className="text-[11px] text-zinc-400">Días promedio entre creación del lead y primer contacto</p>
        </div>
      </div>

      {/* KPIs mín/prom/máx */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Mínimo",   value: data.minimo_dias,   color: "text-emerald-600" },
          { label: "Promedio", value: data.promedio_dias, color: "text-zinc-800"    },
          { label: "Máximo",   value: data.maximo_dias,   color: "text-red-500"     },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/40 rounded-xl p-2.5 text-center">
            <p className={`text-lg font-bold leading-none ${s.color}`}>
              {s.value !== null ? `${s.value}d` : "—"}
            </p>
            <p className="text-[9px] text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Area chart — distribución por buckets */}
      {hasDatos ? (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data.distribucion} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="gradTiempo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#71717a" }}
              tickLine={false} axisLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
            <Tooltip content={<TooltipArea />} />
            <Area filter="url(#neon-glow)"
              type="monotone"
              dataKey="valor"
              stroke={COLORS.primary}
              fill="url(#gradTiempo)"
              strokeWidth={2}
              dot={{ fill: COLORS.primary, r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-xs text-zinc-500">Sin datos de distribución</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/8 flex justify-between items-center text-[10px]">
        <span className="text-zinc-400">{data.total_con_contacto} con primer contacto</span>
        <span className={`font-bold ${vel.cls}`}>{vel.label}</span>
        <span className="text-red-400">{data.sin_contacto} sin contactar</span>
      </div>
    </div>
  );
}
