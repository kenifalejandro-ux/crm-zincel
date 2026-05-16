/**client/src/components/dashboard/ActividadChart.tsx */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function ActividadChart({ metricas }: Props) {
  const datos = [
    { name: "Llamadas",  llamadas: metricas.llamadas.llamadas_mes,    brochures: 0,                              reuniones: 0 },
    { name: "Brochures", llamadas: 0,                                  brochures: metricas.brochures.brochures_mes, reuniones: 0 },
    { name: "Reuniones", llamadas: 0,                                  brochures: 0,                              reuniones: metricas.reuniones.reuniones_mes },
  ].filter(d => d.llamadas > 0 || d.brochures > 0 || d.reuniones > 0);

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5 xl:col-span-3">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <TrendingUp size={16} className="mr-2" />
        Actividad del Período
      </h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" fontSize={12} tick={{ fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
          <YAxis fontSize={12} tick={{ fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="llamadas"  stackId="a" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="brochures" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="reuniones" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4">
        {[
          { label: "Llamadas",  color: "bg-blue-500" },
          { label: "Brochures", color: "bg-purple-500" },
          { label: "Reuniones", color: "bg-amber-500" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span className="text-xs gray-100">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}