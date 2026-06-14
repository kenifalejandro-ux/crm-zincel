/** client/src/components/dashboard/LlamadasChart.tsx */
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PhoneCall } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function LlamadasChart({ metricas }: Props) {
  const c = useChartColors();
  const { total_llamadas, llamadas_contestadas, llamadas_no_contestadas } = metricas.llamadas;

  const tasaContacto = total_llamadas > 0
    ? Math.round((llamadas_contestadas / total_llamadas) * 100)
    : 0;

  const gaugeData = total_llamadas > 0
    ? [
        { value: llamadas_contestadas,    fill: c.palette[1] },
        { value: llamadas_no_contestadas, fill: c.accent     },
      ]
    : [{ value: 1, fill: c.grid }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <PhoneCall size={14} className="mr-2.5 text-green-500" strokeWidth={2} />
        Llamadas
      </h2>

      {/* Gauge semicírculo */}
      <div className="relative" style={{ height: 104 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie filter="url(#neon-glow)"
              data={gaugeData}
              cx="50%" cy="90%"
              startAngle={180} endAngle={0}
              innerRadius={54} outerRadius={72}
              dataKey="value" stroke="none"
              paddingAngle={total_llamadas > 0 ? 2 : 0}
            >
              {gaugeData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className="text-3xl font-bold text-zinc-100 leading-none">{tasaContacto}%</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">tasa de contacto</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "Total",          valor: total_llamadas,          color: "text-zinc-100" },
          { label: "Contestadas",    valor: llamadas_contestadas,    color: "text-emerald-300" },
          { label: "No contest.",    valor: llamadas_no_contestadas, color: "text-accent"    },
        ].map((item, i) => (
          <div key={i} className="text-center bg-white/[0.04] border border-white/[0.06] rounded-xl py-2.5 px-1">
            <p className={`text-xl font-bold leading-none ${item.color}`}>{item.valor}</p>
            <p className="text-[9px] text-zinc-500 mt-1 leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
