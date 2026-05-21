/** client/src/components/propuestas/ResumenEstadosPropuestas.tsx */

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getResumenEstadosPropuestas } from "../../services/propuestas.api";
import type { ResumenEstadoPropuesta } from "../../services/propuestas.api";

const CONFIG: Record<string, { label: string; color: string }> = {
  enviada:         { label: "Enviadas",       color: "#60a5fa" },
  en_negociacion:  { label: "En negociación", color: "#fbbf24" },
  cerrada_ganada:  { label: "Ganadas",        color: "#22c55e" },
  cerrada_perdida: { label: "Perdidas",       color: "#f87171" },
  vencida:         { label: "Vencidas",       color: "#a1a1aa" },
};

function fmt(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const TooltipPersonalizado = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-zinc-800">{d.label}</p>
      <p className="text-zinc-600 mt-0.5">{d.total} propuesta{d.total !== 1 ? "s" : ""}</p>
      {d.monto_total > 0 && <p className="text-zinc-500">{fmt(d.monto_total)}</p>}
      <p className="text-zinc-400 mt-0.5">{d.pct}% del total</p>
    </div>
  );
};

export function ResumenEstadosPropuestas() {
  const [data, setData] = useState<ResumenEstadoPropuesta[]>([]);

  useEffect(() => {
    getResumenEstadosPropuestas().then(setData).catch(() => {});
  }, []);

  const total = data.reduce((s, d) => s + d.total, 0);

  const chartData = Object.entries(CONFIG)
    .map(([estado, cfg]) => {
      const item = data.find((d) => d.estado === estado);
      return {
        estado,
        label:      cfg.label,
        color:      cfg.color,
        total:      item?.total       ?? 0,
        monto_total: item?.monto_total ?? 0,
        pct:        total > 0 ? Math.round(((item?.total ?? 0) / total) * 100) : 0,
      };
    })
    .filter((d) => d.total > 0);

  const placeholder = chartData.length === 0
    ? [{ estado: "_empty", label: "Sin datos", color: "#e4e4e7", total: 1, monto_total: 0, pct: 100 }]
    : chartData;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-zinc-800">Estado de propuestas</p>
        <p className="text-[11px] text-zinc-400">{total} propuesta{total !== 1 ? "s" : ""} en total</p>
      </div>

      <div className="flex items-center gap-4">
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
                dataKey="total"
                strokeWidth={2}
                stroke="#fff"
              >
                {placeholder.map((entry) => (
                  <Cell key={entry.estado} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<TooltipPersonalizado />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Total central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-zinc-800">{total}</span>
            <span className="text-[9px] text-zinc-400 leading-none">total</span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {Object.entries(CONFIG).map(([estado, cfg]) => {
            const item = data.find((d) => d.estado === estado);
            const n   = item?.total       ?? 0;
            const m   = item?.monto_total ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <div key={estado} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-zinc-600 flex-1 truncate">{cfg.label}</span>
                <span className="font-semibold text-zinc-800 tabular-nums">{n}</span>
                {m > 0 && <span className="text-zinc-400 text-[10px] tabular-nums hidden sm:block">{fmt(m)}</span>}
                <span className="text-zinc-400 text-[10px] w-7 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
