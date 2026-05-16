/**client/src/components/dashboard/VentasChart.tsx */

import { DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

export function VentasChart({ metricas }: Props) {
  const { cerradas = 0, en_proceso = 0, no: sinVenta = 0 } = metricas.ventas ?? {};
  const total = cerradas + en_proceso + sinVenta;

  const datos = [
    { name: "Cerradas",   value: cerradas,   color: "#22c55e" },
    { name: "En proceso", value: en_proceso, color: "#f59e0b" },
    { name: "No",         value: sinVenta,         color: "#e5e7eb" },
  ].filter(d => d.value > 0);

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5">
      <h2 className="text-xs font-semibold text-zinc-800 mb-4 flex items-center">
        <DollarSign size={16} className="mr-2" />
        Estado de Ventas
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
            { label: "Cerradas",   valor: cerradas,   color: "#22c55e" },
            { label: "En proceso", valor: en_proceso, color: "#f59e0b" },
            { label: "Sin venta",  valor: sinVenta,         color: "#d1d5db" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs gray-100">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-800">{item.valor}</span>
            </div>
          ))}

          {/* Tasa de cierre */}
          {total > 0 && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-xs text-zinc-800">
                {Math.round((cerradas / total) * 100)}% tasa de cierre
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}