/**client/src/components/dashboard/LlamadasChart.tsx */

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PhoneCall } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function LlamadasChart({ metricas }: Props) {
  const datos = [
    { name: "Contestadas",    value: metricas.llamadas.llamadas_contestadas,    color: "#00ff2a" },
    { name: "No contestadas", value: metricas.llamadas.llamadas_no_contestadas, color: "#ef4444" },
  ];

  const datosGrafico = datos.some(d => d.value > 0)
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#ffffff" }];

  const tasaContacto = metricas.llamadas.total_llamadas > 0
    ? Math.round((metricas.llamadas.llamadas_contestadas / metricas.llamadas.total_llamadas) * 100)
    : 0;

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <PhoneCall size={16} className="mr-2" />
        Llamadas
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
            <span className="text-lg font-semibold text-zinc-800">
              {metricas.llamadas.total_llamadas}
            </span>
          </div>
        </div>

        {/* Detalle */}
        <div className="flex-1 space-y-3">
          {datos.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs gray-100">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-800">{item.value}</span>
            </div>
          ))}
          {metricas.llamadas.total_llamadas > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-[#09f130] h-1.5 rounded-full transition-all"
                  style={{ width: `${tasaContacto}%` }} />
              </div>
              <p className="text-xs text-zinc-800 mt-1">{tasaContacto}% tasa de contacto</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}