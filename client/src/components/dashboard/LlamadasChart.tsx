/** client/src/components/dashboard/LlamadasChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PhoneCall } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

export function LlamadasChart({ metricas }: Props) {
  const datos = [
    { name: "Contestadas",    value: metricas.llamadas.llamadas_contestadas,    color: COLORS.dark },
    { name: "No contestadas", value: metricas.llamadas.llamadas_no_contestadas, color: COLORS.primary },
  ];

  const datosGrafico = datos.some(d => d.value > 0)
    ? datos
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  const tasaContacto = metricas.llamadas.total_llamadas > 0
    ? Math.round((metricas.llamadas.llamadas_contestadas / metricas.llamadas.total_llamadas) * 100)
    : 0;

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <PhoneCall size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Llamadas
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
          {datos.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[12px] font-medium text-zinc-500">{item.name}</span>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900">{item.value}</span>
            </div>
          ))}
          {metricas.llamadas.total_llamadas > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100/60">
              <div className="flex justify-between items-end mb-1.5">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Tasa de contacto</p>
                <p className="text-[11px] font-semibold text-zinc-900">{tasaContacto}%</p>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1">
                <div className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${tasaContacto}%`, backgroundColor: '#27272a' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
