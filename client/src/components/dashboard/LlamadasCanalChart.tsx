/** client/src/components/dashboard/LlamadasCanalChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from "recharts";
import { MessageSquare } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

const MATTE_COLORS = [COLORS.primary, COLORS.primary, COLORS.mutedDark, COLORS.dark, COLORS.dark];

const TooltipCanal = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="font-semibold text-zinc-800 capitalize">{label}</p>
      <p className="text-zinc-600">{payload[0].value} llamadas</p>
    </div>
  );
};

interface Props {
  metricas: Metricas;
}

export function LlamadasCanalChart({ metricas }: Props) {
  const total = metricas.llamadas.total_llamadas;
  const datos = metricas.llamadas_por_canal.map((item, i) => ({
    name:  item.canal,
    value: item.cantidad,
    color: MATTE_COLORS[i % MATTE_COLORS.length],
    pct:   total > 0 ? Math.round((item.cantidad / total) * 100) : 0,
  }));

  const datosGrafico: { name: string; value: number; color: string; pct: number }[] = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 0, color: COLORS.surface, pct: 0 }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <MessageSquare size={14} className="mr-2.5 text-blue-500" strokeWidth={2} />
        Llamadas por Canal
      </h2>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart
          data={datosGrafico}
          margin={{ top: 16, right: 8, bottom: 0, left: -16 }}
          barCategoryGap="35%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
            tickLine={false} axisLine={false}
            tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <YAxis tick={{ fontSize: 10, fill: COLORS.muted }} tickLine={false} axisLine={false} />
          <Tooltip content={<TooltipCanal />} cursor={{ fill: "#f9f9f8" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {datosGrafico.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 12, fontWeight: 700, fill: COLORS.dark }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda con % */}
      <div className="flex justify-around mt-3 pt-3 border-t border-zinc-100">
        {datos.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] font-medium text-zinc-600 capitalize">{item.name}</span>
            <span className="text-[11px] text-zinc-400">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
