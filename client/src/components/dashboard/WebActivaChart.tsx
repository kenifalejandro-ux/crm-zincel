/**client/src/components/dashboard/WebActivaChart.tsx */

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
    { name: "Con web",  value: conWeb,  color: "#3b82f6" },
    { name: "Sin web",  value: sinWeb,  color: "#e5e7eb" },
  ];

  const datosGrafico = total > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <Globe size={16} className="mr-2" />
        Prospectos con Web
      </h2>

      <div className="flex items-center gap-4">

        {/* Donut */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={datosGrafico} cx="50%" cy="50%"
                innerRadius={35} outerRadius={55} paddingAngle={2}
                dataKey="value" labelLine={false}>
                {datosGrafico.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-zinc-800">{total}</span>
          </div>
        </div>

        {/* Detalle */}
        <div className="flex-1 space-y-3">
          {[
            { label: "Con web",  valor: conWeb,  pct: pctConWeb,  color: "#3b82f6", bar: "bg-blue-500" },
            { label: "Sin web",  valor: sinWeb,  pct: pctSinWeb,  color: "#d1d5db", bar: "bg-gray-300" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs gray-100">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800">{item.valor}</span>
                  <span className="text-xs text-zinc-800">({item.pct}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`${item.bar} h-1.5 rounded-full transition-all`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}