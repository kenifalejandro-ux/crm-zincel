/** client/src/components/dashboard/VentasChart.tsx */
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { DollarSign } from "lucide-react";
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Metricas } from "../../pages/DashboardPage";

const MATTE_COLORS = [COLORS.dark, COLORS.primary, COLORS.mutedDark, COLORS.dark, COLORS.primary];

interface Props {
  metricas: Metricas;
}

const TooltipFunnel = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-1.5 text-xs">
      <p className="font-semibold text-zinc-800">{payload[0].payload.name}</p>
      <p className="text-zinc-600">{payload[0].value} contactos</p>
    </div>
  );
};

export function VentasChart({ metricas }: Props) {
  const { cerradas = 0, en_proceso = 0, no: sinVenta = 0 } = metricas.ventas ?? {};
  const porServicio = metricas.ventas_por_servicio ?? [];
  const total       = cerradas + en_proceso + sinVenta;
  const tasaCierre  = total > 0 ? Math.round((cerradas / total) * 100) : 0;

  const funnelData = [
    { name: "Total",      value: total,                  fill: COLORS.dark      },
    { name: "En proceso", value: en_proceso,             fill: COLORS.primary   },
    { name: "Cerradas",   value: Math.max(cerradas, 0),  fill: COLORS.mutedDark },
    { name: "Sin venta",  value: sinVenta,               fill: COLORS.danger    },
  ].filter(d => d.value > 0);

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-4`}>
      <h2 className={HEADER_CLASS}>
        <DollarSign size={14} className="mr-2.5 text-emerald-500" strokeWidth={2} />
        Estado de Ventas
      </h2>

      {total === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-6">Sin registros de ventas</p>
      ) : (
        <>
          {/* Funnel */}
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<TooltipFunnel />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive lastShapeType="rectangle">
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                  <LabelList
                    position="right"
                    fill={COLORS.mutedDark}
                    stroke="none"
                    dataKey="value"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { label: "Total",      valor: total,      color: COLORS.dark      },
              { label: "En proceso", valor: en_proceso, color: COLORS.primary   },
              { label: "Cerradas",   valor: cerradas,   color: COLORS.mutedDark },
              { label: "Sin venta",  valor: sinVenta,   color: COLORS.danger    },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.valor}</p>
                <p className="text-[10px] text-zinc-500 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Tasa de cierre</span>
            <span className="text-sm font-bold text-zinc-900">{tasaCierre}%</span>
          </div>
        </>
      )}

      {/* Por servicio */}
      {porServicio.length > 0 && (
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
            Por servicio (cerradas)
          </p>
          <div className="space-y-3">
            {porServicio.map((s, i) => {
              const maxMonto = porServicio[0]?.monto_total ?? 1;
              const pct      = Math.round((s.monto_total / maxMonto) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-zinc-600 capitalize truncate max-w-[130px]">
                      {s.servicio.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-zinc-600">{s.cantidad} und</span>
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
