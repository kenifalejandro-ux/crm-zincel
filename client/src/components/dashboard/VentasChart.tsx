/**client/src/components/dashboard/VentasChart.tsx */

import { DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

interface Props {
  metricas: Metricas;
}

const COLORES_SERVICIO = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function VentasChart({ metricas }: Props) {
  const { cerradas = 0, en_proceso = 0, no: sinVenta = 0 } = metricas.ventas ?? {};
  const porServicio = metricas.ventas_por_servicio ?? [];
  const total = cerradas + en_proceso + sinVenta;

  const datos = [
    { name: "Cerradas",   value: cerradas,   color: "#22c55e" },
    { name: "En proceso", value: en_proceso, color: "#f59e0b" },
    { name: "Sin venta",  value: sinVenta,   color: "#e5e7eb" },
  ].filter(d => d.value > 0);

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: "#e5e7eb" }];

  return (
    <div className="bg-slate-50 rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <h2 className="text-xs font-semibold text-zinc-800 flex items-center">
        <DollarSign size={16} className="mr-2" />
        Estado de Ventas
      </h2>

      {/* Donut + leyenda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={datosGrafico} cx="50%" cy="50%"
                innerRadius={28} outerRadius={46} paddingAngle={2}
                dataKey="value" labelLine={false}>
                {datosGrafico.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-semibold text-zinc-800">{total}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { label: "Cerradas",   valor: cerradas,   color: "#22c55e" },
            { label: "En proceso", valor: en_proceso, color: "#f59e0b" },
            { label: "Sin venta",  valor: sinVenta,   color: "#d1d5db" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-zinc-600">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-800">{item.valor}</span>
            </div>
          ))}
          {total > 0 && (
            <div className="pt-1.5 border-t border-gray-100">
              <p className="text-xs text-zinc-500">
                {Math.round((cerradas / total) * 100)}% tasa de cierre
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desglose por servicio */}
      {porServicio.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            Por servicio (cerradas)
          </p>
          <div className="space-y-2">
            {porServicio.map((s, i) => {
              const maxMonto = porServicio[0]?.monto_total ?? 1;
              const pct = Math.round((s.monto_total / maxMonto) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-zinc-600 capitalize truncate max-w-[130px]">
                      {s.servicio.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">{s.cantidad}v</span>
                      <span className="text-[11px] font-semibold text-zinc-700">
                        S/ {s.monto_total.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: COLORES_SERVICIO[i % COLORES_SERVICIO.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
