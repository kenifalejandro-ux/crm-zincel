/** client/src/components/dashboard/WebActivaChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { Globe } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";


interface Props {
  metricas: Metricas;
}

export function WebActivaChart({ metricas }: Props) {
  const conWeb  = metricas.prospectos.prospectos_con_web;
  const sinWeb  = metricas.prospectos.prospectos_sin_web;
  const total   = conWeb + sinWeb;

  const pctConWeb  = total > 0 ? Math.round((conWeb  / total) * 100) : 0;
  const pctSinWeb  = total > 0 ? Math.round((sinWeb  / total) * 100) : 0;

  const datos = [
    { name: "Con web",  value: conWeb,  color: COLORS.dark },
    { name: "Sin web",  value: sinWeb,  color: COLORS.primary },
  ];

  const datosGrafico = total > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <Globe size={14} className="mr-2.5 text-cyan-500" strokeWidth={2} />
        Prospectos con Web
      </h2>

      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={datosGrafico} cx="50%" cy="50%"
                innerRadius={36} outerRadius={50} paddingAngle={3}
                dataKey="value" stroke="none">
                {datosGrafico.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 leading-none">{total}</span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">total</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {[
            { label: "Con web",  valor: conWeb,  pct: pctConWeb,  color: COLORS.dark },
            { label: "Sin web",  valor: sinWeb,  pct: pctSinWeb,  color: COLORS.primary },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] font-medium text-zinc-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-zinc-900">{item.valor}</span>
                  <span className="text-[10px] text-zinc-600 font-medium w-8 text-right">({item.pct}%)</span>
                </div>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}