/** client/src/components/inteligencia/TiempoPrimeraRespuesta.tsx */

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Zap } from "lucide-react";
import { getTiempoPrimeraRespuesta, type TiempoPrimeraRespuesta } from "../../services/inteligencia.api";

const TooltipDist = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-2.5 text-xs">
      <p className="font-semibold text-zinc-800">{d.label}</p>
      <p className="text-zinc-600 mt-0.5">{d.valor} prospectos</p>
      <p className="text-zinc-400">{d.pct}% del total</p>
    </div>
  );
};

function velocidadLabel(dias: number | null): { label: string; cls: string } {
  if (dias === null) return { label: "Sin datos", cls: "text-zinc-400" };
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

  const vel = velocidadLabel(data.promedio_dias);
  const placeholder = data.distribucion.every((d) => d.valor === 0)
    ? [{ label: "Sin datos", valor: 1, pct: 100, color: "#e4e4e7" }]
    : data.distribucion;

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-xl border border-zinc-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-amber-50">
          <Zap size={14} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tiempo de primera respuesta</h3>
          <p className="text-[11px] text-zinc-400">Días promedio entre creación del lead y primer contacto</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={placeholder}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                dataKey="valor"
                strokeWidth={2}
                stroke="#fff"
              >
                {placeholder.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<TooltipDist />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-zinc-800">
              {data.promedio_dias !== null ? `${data.promedio_dias}d` : "—"}
            </span>
            <span className="text-[9px] text-zinc-400 leading-none">promedio</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Velocidad general</span>
            <span className={`text-xs font-bold ${vel.cls}`}>{vel.label}</span>
          </div>

          {data.distribucion.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-zinc-600 flex-1">{d.label}</span>
              <span className="font-semibold text-zinc-800 tabular-nums">{d.valor}</span>
              <span className="text-zinc-400 text-[10px] w-8 text-right">{d.pct}%</span>
            </div>
          ))}

          <div className="pt-1 border-t border-gray-100 flex justify-between text-[10px] text-zinc-400">
            <span>{data.total_con_contacto} con contacto</span>
            <span className="text-red-400">{data.sin_contacto} sin primer contacto</span>
          </div>
        </div>
      </div>

      {data.promedio_dias !== null && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Mínimo",  value: data.minimo_dias,  color: "text-emerald-600" },
            { label: "Promedio",value: data.promedio_dias, color: "text-zinc-700"   },
            { label: "Máximo",  value: data.maximo_dias,  color: "text-red-500"    },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-50 rounded-lg p-2">
              <p className={`text-sm font-bold ${s.color}`}>{s.value !== null ? `${s.value}d` : "—"}</p>
              <p className="text-[9px] text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
