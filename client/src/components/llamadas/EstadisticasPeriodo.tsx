/** client/src/components/llamadas/EstadisticasPeriodo.tsx — REDISEÑO NEON
 * El chart YA usaba useChartColors() ✓. Cambios: barras de progreso del detalle
 * (antes bg-zinc-800 track / bg-[#27272a] fill — tema oscuro plano) → track neon
 * + fill de acento con glow; bordes válidos (antes border-white/8).
 * Lógica/props/datos INTACTOS.
 */
import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { PhoneCall, BarChart2 } from "lucide-react";

interface StatItem { fecha: string; total: number; contestadas: number; no_contestadas: number; }
interface ResumenItem { canal: string; por_canal: number; }
interface Props { estadisticas: StatItem[]; resumen: ResumenItem[]; filtroPeriodo: string; }

const CANAL_COLOR: Record<string, string> = { llamada: "#06b6d4", whatsapp: "#34d399", email: "#a855f7", telefono: "#06b6d4" };

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as StatItem;
  return (
    <div className={`${TOOLTIP_BASE} p-3 text-xs`}>
      <p className="font-semibold text-zinc-200 mb-1">{label}</p>
      <p className="text-zinc-300">Total: <span className="font-medium">{d.total}</span></p>
      <p className="text-zinc-300">Contestadas: <span className="font-medium">{d.contestadas}</span></p>
      <p className="text-red-400">No contestadas: <span className="font-medium">{d.no_contestadas}</span></p>
      {d.total > 0 && <p className="text-zinc-300 mt-1">Tasa: {Math.round((d.contestadas / d.total) * 100)}%</p>}
    </div>
  );
};

export function EstadisticasPeriodo({ estadisticas, resumen, filtroPeriodo }: Props) {
  const c = useChartColors();
  const labelPeriodo = filtroPeriodo === "hoy" || filtroPeriodo === "dia" ? "hora" : filtroPeriodo === "anio" ? "mes" : "día";
  const totalItems = estadisticas.length;
  const tickInterval = Math.max(0, Math.ceil(totalItems / 7) - 1);
  const totalCanales = resumen.reduce((s, r) => s + r.por_canal, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Llamadas por período — chart */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <BarChart2 size={14} className="mr-2.5 text-violet-400" strokeWidth={2} />
          Llamadas por {labelPeriodo}
        </h2>
        {totalItems > 0 && (
          <p className="text-[11px] text-zinc-500 font-medium mb-3">{totalItems} {labelPeriodo}{totalItems !== 1 ? "s" : ""} · línea de tendencia</p>
        )}
        {estadisticas.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-10">Sin llamadas en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={estadisticas} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
              <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fontSize: 9, fill: c.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} formatter={(v) => v === "total" ? "Total" : "Contestadas"} />
              <Bar filter="url(#neon-glow)" dataKey="total" fill={c.palette[3]} name="total" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="contestadas" stroke={c.accent} strokeWidth={2}
                dot={totalItems <= 10 ? { r: 3, fill: c.accent } : false} activeDot={{ r: 4 }} name="contestadas" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Llamadas por canal */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <PhoneCall size={14} className="mr-2.5 text-emerald-400" strokeWidth={2} />
          Llamadas por canal
        </h2>
        {resumen.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-3.5">
            {resumen.map((r, i) => {
              const p = totalCanales > 0 ? Math.round((r.por_canal / totalCanales) * 100) : 0;
              const col = CANAL_COLOR[r.canal.toLowerCase()] ?? c.accent;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[12.5px] text-zinc-300 capitalize">
                      <span className="w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />{r.canal}
                    </span>
                    <span className="text-[12px] font-semibold text-zinc-200 tabular-nums">{r.por_canal} <span className="text-zinc-500 font-normal">({p}%)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: col, boxShadow: `0 0 8px ${col}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {estadisticas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-2">Detalle por {labelPeriodo}</h3>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {estadisticas.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-zinc-400 w-16 shrink-0">{stat.fecha}</span>
                  <div className="flex-1 mx-2 bg-white/[0.05] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${stat.total > 0 ? (stat.contestadas / stat.total) * 100 : 0}%`, background: "rgb(var(--accent))", boxShadow: "0 0 6px rgb(var(--accent) / calc(0.6*var(--glow)))" }} />
                  </div>
                  <span className="text-zinc-300 font-medium w-6 text-right tabular-nums">{stat.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}