/**client/src/components/dashboard/ReunionesChart.tsx */

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Video } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const ITEMS = [
  { label: "Programadas",   key: "reuniones_programadas",   color: "#f59e0b" },
  { label: "Realizadas",    key: "reuniones_realizadas",    color: "#14b8a6" },
  { label: "Canceladas",    key: "reuniones_canceladas",    color: "#ef4444" },
  { label: "Reprogramadas", key: "reuniones_reprogramadas", color: "#8b5cf6" },
];

export function ReunionesChart({ metricas }: Props) {
  const datos = ITEMS
    .map(item => ({
      name:  item.label,
      value: (metricas.reuniones as any)[item.key],
      color: item.color,
    }))
    .filter(d => d.value > 0);

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <Video size={16} className="mr-2" />
        Reuniones
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
              {metricas.reuniones.total_reuniones}
            </span>
          </div>
        </div>

        {/* Detalle */}
        <div className="flex-1 space-y-3">
          {ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs gray-100">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-800">
                {(metricas.reuniones as any)[item.key]}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}