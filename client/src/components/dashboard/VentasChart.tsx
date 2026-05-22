/** client/src/components/dashboard/VentasChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

const MATTE_COLORS = [COLORS.dark, COLORS.primary, COLORS.mutedDark, COLORS.mutedLight, "#e4e4e7"];

interface Props {
  metricas: Metricas;
}

export function VentasChart({ metricas }: Props) {
  const { cerradas = 0, en_proceso = 0, no: sinVenta = 0 } = metricas.ventas ?? {};
  const porServicio = metricas.ventas_por_servicio ?? [];
  const total = cerradas + en_proceso + sinVenta;

  const datos = [
    { name: "Cerradas",   value: cerradas,   color: COLORS.dark },
    { name: "En proceso", value: en_proceso, color: COLORS.primary },
    { name: "Sin venta",  value: sinVenta,   color: "#e4e4e7" },
  ].filter(d => d.value > 0);

  const datosGrafico = datos.length > 0
    ? datos
    : [{ name: "Sin datos", value: 1, color: COLORS.surface }];

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-6`}>
      <h2 className={HEADER_CLASS}>
        <DollarSign size={14} className="mr-2.5 text-zinc-400" strokeWidth={2} />
        Estado de Ventas
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
            <span className="text-2xl font-light tracking-tighter text-zinc-900">{total}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {[
            { label: "Cerradas",   valor: cerradas,   color: COLORS.dark },
            { label: "En proceso", valor: en_proceso, color: COLORS.primary },
            { label: "Sin venta",  valor: sinVenta,   color: "#e4e4e7" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[12px] font-medium text-zinc-500">{item.valor}</span>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900">{item.valor}</span>
            </div>
          ))}
          {total > 0 && (
            <div className="pt-3 border-t border-zinc-100/60 mt-2">
              <p className="text-[11px] font-semibold text-zinc-900 flex justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Tasa de cierre</span>
                {Math.round((cerradas / total) * 100)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {porServicio.length > 0 && (
        <div className="border-t border-zinc-100/60 pt-5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
            Por servicio (cerradas)
          </p>
          <div className="space-y-4">
            {porServicio.map((s, i) => {
              const maxMonto = porServicio[0]?.monto_total ?? 1;
              const pct = Math.round((s.monto_total / maxMonto) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-zinc-600 capitalize truncate max-w-[130px]">
                      {s.servicio.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-zinc-400">{s.cantidad} und</span>
                      <span className="text-[12px] font-semibold text-zinc-900">
                        S/ {s.monto_total.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-100">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: MATTE_COLORS[i % MATTE_COLORS.length] }}
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