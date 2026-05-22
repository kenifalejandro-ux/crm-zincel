/** client/src/components/dashboard/FasesCicloVenta.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { TrendingUp } from "lucide-react";
import { getCicloVenta } from "../../services/prospectos.api";


const TooltipPersonalizado = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-3 text-xs">
      <p className="font-semibold text-zinc-900">{d.label}</p>
      <p className="text-zinc-500 text-[10px] mt-0.5">{d.subLabel}</p>
      <p className="text-zinc-900 mt-2 font-medium">{d.dias}d promedio</p>
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
    { key: "prospeccion", label: "Prospección", subLabel: "contacto → propuesta", dias: kpis.promedio_contacto_propuesta ?? 0, color: COLORS.primary },
    { key: "negociacion", label: "Negociación", subLabel: "propuesta → cierre",   dias: kpis.promedio_propuesta_cierre   ?? 0, color: COLORS.muted },
    { key: "total",       label: "Ciclo total", subLabel: "contacto → cierre",    dias: kpis.promedio_dias               ?? 0, color: COLORS.dark },
  ];

  const maxDias = Math.max(...chartData.map((d) => d.dias), 1);

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <TrendingUp size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Ciclo de Venta Promedio
      </h2>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">
            Basado en {kpis.total_cerrados} venta{kpis.total_cerrados !== 1 ? "s" : ""} cerrada{kpis.total_cerrados !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-[11px] font-bold text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
          {kpis.promedio_dias}d total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          barSize={20}
        >
          <XAxis
            type="number"
            domain={[0, maxDias * 1.2]}
            tick={{ fontSize: 10, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            unit="d"
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "#52525b", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={85}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "#fafafa" }} />
          <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
            <LabelList
              dataKey="dias"
              position="right"
              style={{ fontSize: 11, fontWeight: 600, fill: "#18181b" }}
              formatter={(v: number) => `${v}d`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-between text-[10px] text-zinc-400 mt-4 px-1 pt-4 border-t border-zinc-100/60">
        {chartData.map((d) => (
          <span key={d.key} className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: d.color }} />
            {d.subLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
