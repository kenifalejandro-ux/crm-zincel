/** client/src/components/dashboard/LlamadasCanalChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MessageSquare } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

const MATTE_COLORS = [COLORS.dark, COLORS.primary, COLORS.mutedDark, COLORS.mutedLight, "#e4e4e7"];

interface Props {
  metricas: Metricas;
}

export function LlamadasCanalChart({ metricas }: Props) {
  const datos = metricas.llamadas_por_canal.map((item, i) => ({
    name:  item.canal,
    value: item.cantidad,
    color: MATTE_COLORS[i % MATTE_COLORS.length],
  }));

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <MessageSquare size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Llamadas por Canal
      </h2>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={datosGrafico} cx="50%" cy="50%"
                innerRadius={35} outerRadius={46} paddingAngle={2}
                dataKey="value" stroke="none">
                {datosGrafico.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-light tracking-tighter text-zinc-900">
              {metricas.llamadas.total_llamadas}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {datos.length === 0 ? (
            <p className="text-[12px] text-zinc-400">Sin registros</p>
          ) : (
            datos.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] font-medium text-zinc-500 capitalize">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold text-zinc-900">{item.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}