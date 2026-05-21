/** client/src/components/dashboard/FasesCicloVenta.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { getCicloVenta } from "../../services/prospectos.api";

const FASES = [
  { key: "prospeccion", label: "Prospección",  subLabel: "contacto → propuesta", color: "#60a5fa" },
  { key: "negociacion", label: "Negociación",  subLabel: "propuesta → cierre",   color: "#fbbf24" },
  { key: "total",       label: "Ciclo total",  subLabel: "contacto → cierre",    color: "#6366f1" },
];

const TooltipPersonalizado = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-zinc-800">{d.label}</p>
      <p className="text-zinc-500 text-[10px] mt-0.5">{d.subLabel}</p>
      <p className="text-zinc-700 mt-1 font-medium">{d.dias}d promedio</p>
    </div>
  );
};

export function FasesCicloVenta() {
  const [kpis, setKpis] = useState<{
    promedio_dias:               number | null;
    promedio_contacto_propuesta: number | null;
    promedio_propuesta_cierre:   number | null;
    total_cerrados:              number;
  } | null>(null);

  useEffect(() => {
    getCicloVenta()
      .then((d) => setKpis(d.kpis))
      .catch(() => {});
  }, []);

  if (!kpis || kpis.total_cerrados === 0) return null;

  const chartData = [
    { key: "prospeccion", label: "Prospección", subLabel: "contacto → propuesta", dias: kpis.promedio_contacto_propuesta ?? 0, color: "#60a5fa" },
    { key: "negociacion", label: "Negociación", subLabel: "propuesta → cierre",   dias: kpis.promedio_propuesta_cierre   ?? 0, color: "#fbbf24" },
    { key: "total",       label: "Ciclo total", subLabel: "contacto → cierre",    dias: kpis.promedio_dias               ?? 0, color: "#6366f1" },
  ];

  const maxDias = Math.max(...chartData.map((d) => d.dias), 1);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800">Ciclo de venta promedio</p>
          <p className="text-[11px] text-zinc-400">
            Basado en {kpis.total_cerrados} venta{kpis.total_cerrados !== 1 ? "s" : ""} cerrada{kpis.total_cerrados !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
          {kpis.promedio_dias}d total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          barSize={20}
        >
          <XAxis
            type="number"
            domain={[0, maxDias * 1.2]}
            tick={{ fontSize: 9, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            unit="d"
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 10, fill: "#52525b" }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "#f4f4f5" }} />
          <Bar dataKey="dias" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
            <LabelList
              dataKey="dias"
              position="right"
              style={{ fontSize: 11, fontWeight: 600, fill: "#3f3f46" }}
              formatter={(v: number) => `${v}d`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Sub-labels */}
      <div className="flex justify-between text-[10px] text-zinc-400 mt-1 px-1">
        {chartData.map((d) => (
          <span key={d.key} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: d.color }} />
            {d.subLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
