/**client/src/components/dashboard/LlamadasCanalChart.tsx */

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MessageSquare } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const COLORES = ["#3b82f6", "#25d366", "#ea4335", "#f59e0b", "#8b5cf6"];

export function LlamadasCanalChart({ metricas }: Props) {
  const datos = metricas.llamadas_por_canal.map((item, i) => ({
    name:  item.canal,
    value: item.cantidad,
    color: COLORES[i % COLORES.length],
  }));

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <MessageSquare size={16} className="mr-2" />
        Llamadas por Canal
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
          {datos.length === 0 ? (
            <p className="text-xs text-zinc-800">Sin registros</p>
          ) : (
            datos.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs gray-100 capitalize">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-zinc-800">{item.value}</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}